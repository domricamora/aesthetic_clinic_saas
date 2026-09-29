<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Pos\RingUpSale;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Sale;
use App\Models\Treatment;
use App\Payments\PaymentManager;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The counter (plan.md 19). Staff ring up services and products, take payment
 * and print a receipt. Every amount is calculated on the server from the
 * catalogue, so the register screen never decides what something costs.
 */
class PosController extends Controller
{
    public function index(Request $request, PaymentManager $payments): Response
    {
        $filters = $request->validate([
            'branch' => ['nullable', 'integer'],
            'lead' => ['nullable', 'integer'],
            'q' => ['nullable', 'string', 'max:60'],
        ]);

        $branchId = isset($filters['branch']) ? (int) $filters['branch'] : Branch::orderBy('id')->value('id');
        $branch = Branch::findOrFail($branchId);

        return Inertia::render('admin/pos/index', [
            'branch_id' => $branchId,
            'branches' => Branch::where('is_active', true)->orderBy('id')->get(['id', 'name']),
            'lead' => isset($filters['lead']) ? $this->leadPayload(Lead::find($filters['lead'])) : null,
            'query' => $filters['q'] ?? '',
            'services' => Treatment::where('is_active', true)->orderBy('sort')->get(['id', 'name', 'price', 'promo_price', 'duration_minutes'])
                ->map(fn (Treatment $t) => $this->itemPayload('service', $t->id, $t->name, (float) ($t->promo_price ?: $t->price), null))
                ->values(),
            'products' => Product::sellable()->with('stocks')->orderBy('name')->get(['id', 'name', 'price'])
                ->map(fn (Product $p) => $this->itemPayload('product', $p->id, $p->name, (float) $p->price, $p->onHandAt($branch)))
                ->values(),
            'promotions' => Promotion::where('is_active', true)->orderBy('sort')->get(['id', 'title'])->map(fn (Promotion $p) => ['id' => $p->id, 'title' => $p->title])->values(),
            'methods' => Payment::METHODS,
            'available_methods' => $payments->availableMethods(),
            'statuses' => Sale::STATUSES,
        ]);
    }

    /** @return array<string, mixed> */
    private function itemPayload(string $kind, int $id, string $name, float $price, ?int $stock): array
    {
        return ['kind' => $kind, 'id' => $id, 'name' => $name, 'price' => $price, 'stock' => $stock];
    }

    /** @return array<string, mixed>|null */
    private function leadPayload(?Lead $lead): ?array
    {
        return $lead ? ['id' => $lead->id, 'name' => $lead->fullName(), 'phone' => $lead->phone] : null;
    }

    public function store(Request $request, RingUpSale $ring): RedirectResponse
    {
        $data = $request->validate([
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')],
            'items' => ['required', 'array', 'min:1'],
            'items.*.kind' => ['required', Rule::in(['service', 'product'])],
            'items.*.id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'discount_type' => ['nullable', Rule::in(['none', 'percent', 'fixed'])],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'method' => ['required', Rule::in(array_keys(Payment::METHODS))],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'client_name' => ['nullable', 'string', 'max:80'],
            'client_phone' => ['nullable', 'string', 'max:30'],
            'lead_id' => ['nullable', 'integer'],
            'promotion_id' => ['nullable', 'integer'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $completed = $ring($data, $request->user());

        return redirect()
            ->to(route('admin.pos.sales.show', $completed->sale))
            ->with('success', sprintf(
                'Sale %s recorded. %s',
                $completed->sale->reference,
                $completed->change > 0 ? sprintf('Change %s%.2f.', config('clinic.currency_symbol'), $completed->change) : 'Thank you.'
            ));
    }

    /** Sales list for the day, or a wider window, with the day's takings. */
    public function sales(Request $request): Response
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'branch' => ['nullable', 'integer'],
        ]);

        $day = CarbonImmutable::parse($filters['date'] ?? now()->toDateString());
        $scope = fn (Builder $query) => $query
            ->whereBetween('created_at', [$day->startOfDay(), $day->endOfDay()])
            ->when($filters['branch'] ?? null, fn (Builder $q, $branch) => $q->where('branch_id', $branch));

        return Inertia::render('admin/pos/sales/index', [
            'date' => $day->toDateString(),
            'branch' => isset($filters['branch']) ? (int) $filters['branch'] : null,
            'branches' => Branch::orderBy('id')->get(['id', 'name']),
            'sales' => $scope(Sale::query()->with(['user:id,name', 'branch:id,name']))
                ->latest('id')
                ->get()
                ->map(fn (Sale $sale) => $this->salePayload($sale))
                ->values(),
            'summary' => [
                'count' => (clone $scope(Sale::query()))->count(),
                'total' => round((float) (clone $scope(Sale::query()))->sum('total'), 2),
                'paid' => round((float) (clone $scope(Sale::query()))->sum('amount_paid'), 2),
                'due' => round((float) (clone $scope(Sale::query()))->sum(DB::raw('total - amount_paid')), 2),
            ],
            'statuses' => Sale::STATUSES,
        ]);
    }

    /** @return array<string, mixed> */
    private function salePayload(Sale $sale): array
    {
        return [
            'id' => $sale->id,
            'reference' => $sale->reference,
            'client' => $sale->client_name ?: $sale->lead?->fullName() ?: 'Walk-in',
            'branch' => $sale->branch?->name,
            'cashier' => $sale->user?->name,
            'total' => $sale->total,
            'amount_paid' => $sale->amount_paid,
            'balance' => $sale->balance,
            'status' => $sale->status,
            'created_at' => $sale->created_at->toIso8601String(),
        ];
    }

    /** The receipt: a printable record of what was sold and how it was paid. */
    public function show(Sale $sale): Response
    {
        $sale->load(['items', 'payments.user:id,name', 'branch:id,name', 'user:id,name', 'lead:id,first_name,last_name', 'promotion:id,title']);

        return Inertia::render('admin/pos/sales/show', [
            'sale' => [
                'id' => $sale->id,
                'reference' => $sale->reference,
                'status' => $sale->status,
                'client_name' => $sale->client_name,
                'client_phone' => $sale->client_phone,
                'client' => $sale->client_name ?: $sale->lead?->fullName() ?: 'Walk-in',
                'branch' => $sale->branch?->name,
                'cashier' => $sale->user?->name,
                'promotion' => $sale->promotion?->title,
                'note' => $sale->note,
                'subtotal' => $sale->subtotal,
                'discount_type' => $sale->discount_type,
                'discount_value' => $sale->discount_value,
                'discount_amount' => $sale->discount_amount,
                'total' => $sale->total,
                'amount_paid' => $sale->amount_paid,
                'balance' => $sale->balance,
                'paid_at' => $sale->paid_at?->toIso8601String(),
                'created_at' => $sale->created_at->toIso8601String(),
                'items' => $sale->items->map(fn ($item) => [
                    'kind' => $item->kind,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'line_total' => $item->line_total,
                ])->values(),
                'payments' => $sale->payments->map(fn (Payment $p) => [
                    'id' => $p->id,
                    'method' => $p->method,
                    'method_label' => $p->methodLabel(),
                    'type' => $p->type,
                    'amount' => $p->amount,
                    'reference' => $p->reference,
                    'note' => $p->note,
                    'taken_by' => $p->user?->name,
                    'paid_at' => $p->paid_at->toIso8601String(),
                ])->values(),
            ],
            'methods' => Payment::METHODS,
            'statuses' => Sale::STATUSES,
        ]);
    }

    public function refund(Request $request, Sale $sale, RingUpSale $ring): RedirectResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', Rule::in(array_keys(Payment::METHODS))],
            'reason' => ['required', 'string', 'max:200'],
        ], ['reason.required' => 'Say why the refund is being given.']);

        $ring->refund($sale, (float) $data['amount'], $data['method'], $data['reason'], $request->user());

        // Money went back out, so somebody is going to ask about it later.
        AuditLog::record(
            'sale.refund',
            sprintf(
                'Refunded %s on %s (%s)',
                number_format((float) $data['amount'], 2),
                $sale->reference,
                $data['reason'],
            ),
            $sale,
            [
                'amount' => (float) $data['amount'],
                'method' => $data['method'],
                'reason' => $data['reason'],
            ],
            $request,
        );

        return back()->with('success', 'Refund recorded on '.$sale->reference.'.');
    }
}
