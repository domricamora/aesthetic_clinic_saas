<?php

namespace App\Actions\Accounting;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Puts a counter sale into the books (plan.md §24): what was taken in cash or
 * owed, what it earned, and what the stock it used up cost.
 *
 * A posting is bookkeeping, not commerce, so it never undoes a sale that
 * already happened. If the books cannot take it (a closed month, no chart), the
 * reason is written on the sale and can be posted later.
 */
class PostSale
{
    public function __construct(private readonly PostEntry $entries) {}

    public function __invoke(Sale $sale, User $user, ?string $sourceType = null, string $prefix = 'Sale'): void
    {
        $isRefund = $sourceType === 'pos_refund';
        $items = $sale->items()->get();

        $serviceTotal = round((float) $items->where('kind', 'service')->sum('line_total'), 2);
        $productTotal = round((float) $items->where('kind', 'product')->sum('line_total'), 2);
        $goodsCost = round($this->costOfGoods($items), 2);
        $money = $isRefund ? -$sale->amount_paid : $sale->total;

        if ($money < 0.01 && $goodsCost < 0.01) {
            return;
        }

        $lines = [];

        // What came in: cash in hand, and whatever the client still owes.
        $cash = $isRefund ? min(abs($money), $sale->total) : $sale->amount_paid;
        $outstanding = $isRefund ? 0.0 : $sale->balance;

        if ($cash > 0.01) {
            $lines[] = ['account' => '1000', 'debit' => $cash, 'memo' => $sale->reference];
        }

        if ($outstanding > 0.01) {
            $lines[] = ['account' => '1200', 'debit' => $outstanding, 'memo' => 'Unpaid on '.$sale->reference];
        }

        if ($isRefund) {
            // Taking the earnings back, in the same proportion as the money.
            $share = $sale->total > 0 ? abs($money) / $sale->total : 1;
            $serviceShare = round($serviceTotal * $share, 2);
            $productShare = round($productTotal * $share, 2);
            $discountShare = round($sale->discount_amount * $share, 2);

            foreach ([['4000', $serviceShare], ['4010', $productShare]] as [$code, $amount]) {
                if ($amount > 0.01) {
                    $lines[] = ['account' => $code, 'debit' => $amount, 'memo' => $prefix.' '.$sale->reference];
                }
            }

            if ($discountShare > 0.01) {
                $lines[] = ['account' => '4020', 'credit' => $discountShare, 'memo' => 'Reversed on '.$sale->reference];
            }

            $lines[] = ['account' => '1000', 'credit' => $money, 'memo' => $prefix.' '.$sale->reference];

            if ($goodsCost > 0.01) {
                $lines[] = ['account' => '1300', 'debit' => $goodsCost, 'memo' => 'Returned stock'];
                $lines[] = ['account' => '5000', 'credit' => $goodsCost, 'memo' => 'Returned stock'];
            }

            $this->post($lines, $this->attributes($sale, 'pos_refund', $prefix), $user);

            return;
        }

        foreach ([['4000', $serviceTotal], ['4010', $productTotal]] as [$code, $amount]) {
            if ($amount > 0.01) {
                $lines[] = ['account' => $code, 'credit' => $amount, 'memo' => $sale->reference];
            }
        }

        if ($sale->discount_amount > 0.01) {
            $lines[] = ['account' => '4020', 'debit' => $sale->discount_amount, 'memo' => 'Discount on '.$sale->reference];
        }

        if ($goodsCost > 0.01) {
            $lines[] = ['account' => '5000', 'debit' => $goodsCost, 'memo' => 'Cost of '.$sale->reference];
            $lines[] = ['account' => '1300', 'credit' => $goodsCost, 'memo' => 'Stock used in '.$sale->reference];
        }

        $this->post($lines, $this->attributes($sale, 'pos_sale', $prefix), $user);
    }

    /** @param  Collection<int, SaleItem>  $items */
    private function costOfGoods($items): float
    {
        $costs = $items
            ->where('kind', 'product')
            ->map(fn (SaleItem $item) => (float) (Product::where('id', $item->product_id)->value('cost') ?? 0) * $item->quantity);

        return round((float) $costs->sum(), 2);
    }

    /** @return array<string, mixed> */
    private function attributes(Sale $sale, string $sourceType, string $prefix): array
    {
        return [
            'entry_date' => $sale->created_at->toDateString(),
            'memo' => $prefix.' '.$sale->reference,
            'source_type' => $sourceType,
            'source_id' => $sourceType === 'pos_sale' ? $sale->id : $sale->id.'-refund',
        ];
    }

    /** @param  array<int, array<string, mixed>>  $lines */
    private function post(array $lines, array $attributes, User $user): void
    {
        try {
            ($this->entries)($lines, $attributes, $user);
        } catch (ValidationException $e) {
            // The sale stands; the books are told why it is missing.
            $sale = $attributes['source_id'] ? Sale::find($attributes['source_id']) : null;
            $sale?->update([
                'note' => trim(($sale->note ?? '').' Not posted to the books: '.($e->validator->errors()->first() ?? 'unknown reason')),
            ]);
        }
    }
}
