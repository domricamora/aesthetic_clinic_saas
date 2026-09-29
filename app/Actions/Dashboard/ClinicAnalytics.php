<?php

namespace App\Actions\Dashboard;

use App\Models\Appointment;
use App\Models\ChatConversation;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * The numbers behind the dashboard's graphs.
 *
 * Three things worth being explicit about, because the alternative is a chart
 * that looks authoritative and is quietly wrong:
 *
 * 1. Revenue is net of refunds. A refund is money the clinic took back, and
 *    grossing it up would mean the graph disagreed with the till.
 *
 * 2. "Profit" here is gross profit -- revenue less the cost of the goods
 *    sold. It is not what is left after paying anyone. Calling it profit
 *    without saying so is how a clinic owner concludes a 90% margin means a
 *    good month, when payroll has not been subtracted. Treatments are labour
 *    and carry no cost of goods here, which flatters the margin; the UI says
 *    as much next to the number.
 *
 * 3. Days with nothing on them come back as zero rather than missing, so a
 *    gap in the data reads as a quiet day and not as a broken chart.
 */
class ClinicAnalytics
{
    public function __construct(private readonly int $days = 30) {}

    public function toArray(): array
    {
        $today = now()->startOfDay();
        $from = $today->copy()->subDays($this->days - 1);
        $previousFrom = $from->copy()->subDays($this->days);

        return [
            'window' => [
                'days' => $this->days,
                'from' => $from->toDateString(),
                'to' => $today->toDateString(),
            ],
            'money' => $this->money($from, $previousFrom),
            'daily' => $this->daily($from, $today),
            'bookings' => $this->bookingBreakdown($from, $today),
            'top_treatments' => $this->topTreatments($from, $today),
            'payment_mix' => $this->paymentMix($from, $today),
            'front_desk' => $this->frontDesk($from, $previousFrom),
        ];
    }

    /**
     * Headline figures, each against the equivalent stretch before it.
     *
     * A single number says "42,000 this month" and leaves the reader to guess
     * whether that is good. Set against the previous period it says something
     * they can act on, which is the only reason to put a number here at all.
     */
    private function money(CarbonImmutable $from, CarbonImmutable $previousFrom): array
    {
        [$revenue, $refunds, $discount] = $this->revenueTotals($from);
        [$cost] = $this->costOfGoods($from);
        [$priorRevenue, $priorRefunds] = $this->revenueTotals($previousFrom);
        [$priorCost] = $this->costOfGoods($previousFrom);

        $net = $revenue - $refunds;
        $priorNet = $priorRevenue - $priorRefunds;
        $saleCount = Sale::where('created_at', '>=', $from)->count();

        return [
            'revenue' => $net,
            'profit' => $net - $cost,
            'previous_revenue' => $priorNet,
            'previous_profit' => $priorNet - $priorCost,
            'refunds' => $refunds,
            'discounts' => $discount,
            'cost_of_goods' => $cost,
            'sales' => $saleCount,
            'average_sale' => $saleCount > 0 ? round($net / $saleCount, 2) : 0.0,
        ];
    }

    /** @return array{0: float, 1: float, 2: float} revenue, refunds, discounts */
    private function revenueTotals(CarbonImmutable $from): array
    {
        $row = Sale::where('created_at', '>=', $from)
            ->selectRaw('COALESCE(SUM(total), 0) AS revenue')
            ->selectRaw('COALESCE(SUM(discount_amount), 0) AS discount')
            ->first();

        $refunds = (float) Payment::where('type', 'refund')
            ->where('paid_at', '>=', $from)
            ->sum('amount');

        return [(float) $row->revenue, $refunds, (float) $row->discount];
    }

    /**
     * Cost of goods, joined at the line rather than read off the sale.
     *
     * product_id is nulled when a product is deleted, so a line whose product
     * is gone contributes revenue and no cost. That understates cost, which is
     * the safe direction to be wrong in: a slightly better margin rather than
     * a loss that never happened.
     */
    private function costOfGoods(CarbonImmutable $from): array
    {
        $cost = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.created_at', '>=', $from)
            ->where('sale_items.kind', 'product')
            ->selectRaw('COALESCE(SUM(sale_items.quantity * products.cost), 0) AS cost')
            ->value('cost');

        return [(float) $cost];
    }

    /**
     * One row per day, every day present.
     *
     * Grouped in PHP rather than SQL so the zeroes are guaranteed. A DATE()
     * group over a window with no sales returns nothing at all, and a chart
     * that silently starts a fortnight late is worse than no chart.
     */
    private function daily(CarbonImmutable $from, CarbonImmutable $today): array
    {
        $keys = [];

        // Advanced by reassignment rather than in place. CarbonImmutable::addDay
        // returns a new instance, so `$day->addDay()` on its own would leave the
        // loop variable where it started and this would never finish.
        $day = $from;

        while ($day->lte($today)) {
            $keys[$day->toDateString()] = [
                'date' => $day->toDateString(),
                'revenue' => 0.0,
                'profit' => 0.0,
                'bookings' => 0,
                'completed' => 0,
                'no_show' => 0,
                'leads' => 0,
            ];

            $day = $day->addDay();
        }

        $refunds = Payment::where('type', 'refund')
            ->where('paid_at', '>=', $from)
            ->get(['paid_at', 'amount'])
            ->groupBy(fn (Payment $p) => $p->paid_at->toDateString());

        $sales = Sale::where('created_at', '>=', $from)
            ->get(['created_at', 'total'])
            ->groupBy(fn (Sale $s) => $s->created_at->toDateString());

        foreach ($sales as $date => $rows) {
            if (! isset($keys[$date])) continue;

            $keys[$date]['revenue'] = round((float) $rows->sum('total'), 2);
        }

        // Refunds are applied on their own, not folded in with the sales above.
        // Subtracting them inside that loop would only ever reach days that
        // also had a sale, so a refund given on a quiet day would vanish from
        // the chart while still being in the headline figure -- and the daily
        // bars would stop adding up to the total above them.
        foreach ($refunds as $date => $rows) {
            if (isset($keys[$date])) {
                $keys[$date]['revenue'] = round(
                    $keys[$date]['revenue'] - (float) $rows->sum('amount'),
                    2,
                );
            }
        }

        // Cost per day, so the profit line follows the revenue line rather
        // than being one flat total spread across the window.
        $costs = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.created_at', '>=', $from)
            ->where('sale_items.kind', 'product')
            ->get(['sales.created_at', DB::raw('sale_items.quantity * products.cost AS line_cost')])
            ->groupBy(fn ($row) => CarbonImmutable::parse($row->created_at)->toDateString());

        foreach ($costs as $date => $rows) {
            if (isset($keys[$date])) {
                $keys[$date]['profit'] = round(
                    $keys[$date]['revenue'] - (float) $rows->sum('line_cost'),
                    2,
                );
            }
        }

        $bookings = Appointment::where('created_at', '>=', $from)
            ->get(['created_at', 'status'])
            ->groupBy(fn (Appointment $a) => $a->created_at->toDateString());

        foreach ($bookings as $date => $rows) {
            if (! isset($keys[$date])) continue;

            $keys[$date]['bookings'] = $rows->count();
            $keys[$date]['completed'] = $rows->where('status', 'completed')->count();
            $keys[$date]['no_show'] = $rows->where('status', 'no_show')->count();
        }

        $leads = Lead::where('created_at', '>=', $from)
            ->get(['created_at'])
            ->groupBy(fn (Lead $l) => $l->created_at->toDateString());

        foreach ($leads as $date => $rows) {
            if (isset($keys[$date])) $keys[$date]['leads'] = $rows->count();
        }

        return array_values($keys);
    }

    /** Where the appointments in the window actually ended up. */

    /** Where the appointments in the window actually ended up. */
    private function bookingBreakdown(CarbonImmutable $from, CarbonImmutable $today): array
    {
        return Appointment::whereBetween('starts_at', [$from, $today->copy()->endOfDay()])
            ->whereNotIn('status', ['cancelled', 'rescheduled'])
            ->selectRaw('status, COUNT(*) AS total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($count, $status) => [
                'status' => $status,
                'label' => Appointment::STATUSES[$status] ?? $status,
                'count' => (int) $count,
            ])
            ->values()
            ->all();
    }

    /**
     * What the counter actually sold.
     *
     * Grouped on the snapshot description rather than treatment_id, because
     * the description is what the customer was charged and it survives a
     * treatment being renamed or deleted since.
     */
    private function topTreatments(CarbonImmutable $from, CarbonImmutable $today): array
    {
        return SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->whereBetween('sales.created_at', [$from, $today->copy()->endOfDay()])
            ->where('sale_items.kind', 'service')
            ->selectRaw('sale_items.description, SUM(sale_items.quantity) AS sold, SUM(sale_items.line_total) AS revenue')
            ->groupBy('sale_items.description')
            ->orderByDesc('revenue')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->description,
                'sold' => (int) $row->sold,
                'revenue' => round((float) $row->revenue, 2),
            ])
            ->all();
    }

    /** Money actually taken, by how it was taken. Refunds count as negative. */
    private function paymentMix(CarbonImmutable $from, CarbonImmutable $today): array
    {
        $rows = Payment::whereBetween('paid_at', [$from, $today->copy()->endOfDay()])
            ->selectRaw('method, type, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount')
            ->groupBy('method', 'type')
            ->get();

        $mix = [];

        foreach ($rows as $row) {
            $method = $row->method;
            $mix[$method] ??= [
                'method' => $method,
                'label' => Payment::METHODS[$method] ?? $method,
                'amount' => 0.0,
                'count' => 0,
            ];

            $mix[$method]['amount'] += ($row->type === 'refund' ? -1 : 1) * (float) $row->amount;
            $mix[$method]['count'] += (int) $row->count;
        }

        $mix = array_values($mix);
        usort($mix, fn ($a, $b) => $b['amount'] <=> $a['amount']);

        return array_map(fn (array $row) => [
            ...$row,
            'amount' => round($row['amount'], 2),
        ], $mix);
    }

    /** Enquiries and conversations, the two things the website produces. */
    private function frontDesk(CarbonImmutable $from): array
    {
        $newLeads = Lead::where('created_at', '>=', $from)->count();
        $won = Lead::where('created_at', '>=', $from)
            ->whereIn('stage', ['customer', 'repeat_customer', 'vip'])
            ->count();

        return [
            'leads' => $newLeads,
            'won' => $won,
            // Share of enquiries that became customers. Null rather than zero
            // when nothing was asked: 0% is a claim about performance, and
            // "nobody asked" is a claim about volume.
            'conversion' => $newLeads > 0 ? round($won / $newLeads, 4) : null,
            'conversations' => ChatConversation::where('created_at', '>=', $from)->count(),
            'open_conversations' => ChatConversation::where('status', 'open')
                ->where('created_at', '>=', $from)
                ->count(),
        ];
    }
}
