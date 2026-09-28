<?php

namespace App\Actions\Pos;

use App\Actions\Inventory\ManageStock;
use App\Models\Branch;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Treatment;
use App\Models\User;
use App\Payments\Charge;
use App\Payments\PaymentManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** What the register needs afterwards: the sale, the cash handed back, the receipt reference. */
final readonly class CompletedSale
{
    public function __construct(
        public Sale $sale,
        public float $tendered,
        public float $change,
        public ?string $paymentReference = null,
    ) {}
}

/**
 * Rings up a sale (plan.md 19). Prices, discounts, stock and the payment status
 * all come from the server: the browser says what was rung up and how much was
 * handed over, never what it is worth or whether it was paid.
 */
class RingUpSale
{
    public function __construct(
        private readonly PaymentManager $payments,
        private readonly ManageStock $stock,
    ) {}

    /**
     * @param  array<string, mixed>  $data  validated cart, discount, client and payment
     *
     * @throws ValidationException
     */
    public function __invoke(array $data, User $cashier): CompletedSale
    {
        $lines = $this->resolveLines($data['items'] ?? []);

        if ($lines === []) {
            throw ValidationException::withMessages(['items' => 'Add at least one item to the sale.']);
        }

        [$subtotal, $discount] = $this->totals($lines, $data);
        $total = max(0, round($subtotal - $discount, 2));
        $tendered = round((float) ($data['amount'] ?? $total), 2);
        $method = (string) $data['method'];

        // Cash may be handed over in excess and the till keeps the change. A card
        // or wallet payment is the amount due and never more, so what is applied
        // to the balance is capped at the total either way.
        $applied = min(max($tendered, 0), $total);

        $sale = DB::transaction(function () use ($data, $cashier, $lines, $subtotal, $discount, $total, $applied, $method) {
            $sale = Sale::create([
                'reference' => Sale::nextReference(),
                'branch_id' => $data['branch_id'],
                'user_id' => $cashier->id,
                'lead_id' => $data['lead_id'] ?? null,
                'promotion_id' => $data['promotion_id'] ?? null,
                'client_name' => $data['client_name'] ?? null,
                'client_phone' => $data['client_phone'] ?? null,
                'subtotal' => $subtotal,
                'discount_type' => $data['discount_type'] ?? 'none',
                'discount_value' => (float) ($data['discount_value'] ?? 0),
                'discount_amount' => $discount,
                'total' => $total,
                'amount_paid' => 0,
                'status' => 'unpaid',
                'note' => $data['note'] ?? null,
            ]);

            foreach ($lines as $line) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'kind' => $line['kind'],
                    'treatment_id' => $line['treatment']?->id,
                    'product_id' => $line['product']?->id,
                    'description' => $line['description'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'line_total' => $line['line_total'],
                ]);
            }

            $this->takeStock($lines, Branch::findOrFail($data['branch_id']), $sale->reference, $cashier);

            if ($applied > 0) {
                $result = $this->payments->charge($method, Charge::pesos($applied, $sale->reference, $method, $data['note'] ?? null));

                if (! $result->approved) {
                    throw ValidationException::withMessages(['method' => $result->message ?: 'That payment was not approved.']);
                }

                $this->recordPayment($sale, $method, $applied, $cashier, $result->providerReference);
            }

            return $sale->refresh();
        });

        return new CompletedSale(
            sale: $sale,
            tendered: $tendered,
            change: max(0, round($tendered - $sale->total, 2)),
            paymentReference: $sale->payments()->where('type', 'payment')->value('reference'),
        );
    }

    /**
     * Returns stock and records the money as a negative payment. Stock movements
     * get their own ledger with inventory (plan.md 21).
     */
    public function refund(Sale $sale, float $amount, string $method, string $reason, User $user): Sale
    {
        // Only money that was actually collected can be handed back, so
        // amount_paid can never go negative. A fully paid sale is refundable:
        // the cap is what was taken, not the balance still owed.
        $amount = round(min(max($amount, 0), $sale->amount_paid), 2);

        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'There is nothing on this sale to refund.']);
        }

        $result = $this->payments->refund($method, Charge::pesos($amount, $sale->reference, $method, $reason));

        if (! $result->approved) {
            throw ValidationException::withMessages(['amount' => $result->message ?: 'That refund was not approved.']);
        }

        DB::transaction(function () use ($sale, $amount, $method, $reason, $user, $result) {
            $branch = $sale->load('branch')->branch;

            foreach ($sale->items()->whereNotNull('product_id')->with('product')->get() as $item) {
                // Back on the shelf as a fresh undated lot: the lot it came off
                // is history, and guessing its expiry would be worse.
                $this->stock->returnStock($item->product, $branch, $item->quantity, $sale->reference, $user);
            }

            $this->recordPayment($sale, $method, $amount, $user, $result->providerReference, 'refund', $reason);
        });

        return $sale->refresh();
    }

    /**
     * Merge duplicate lines and price them from the catalogue.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function resolveLines(array $items): array
    {
        $quantities = [];

        foreach ($items as $item) {
            $key = $item['kind'].':'.$item['id'];
            $quantities[$key] = ($quantities[$key] ?? 0) + max(1, (int) $item['quantity']);
        }

        $lines = [];

        foreach ($quantities as $key => $quantity) {
            [$kind, $id] = explode(':', $key);

            $model = $kind === 'service'
                ? Treatment::where('is_active', true)->find($id)
                : Product::sellable()->find($id);

            if (! $model) {
                throw ValidationException::withMessages(['items' => 'One of the items is no longer sold. Refresh the register.']);
            }

            // A promo price on a treatment wins over the list price.
            $price = (float) ($kind === 'service' ? ($model->promo_price ?: $model->price) : $model->price);

            $lines[] = [
                'kind' => $kind,
                'treatment' => $kind === 'service' ? $model : null,
                'product' => $kind === 'product' ? $model : null,
                'description' => $model->name,
                'quantity' => $quantity,
                'unit_price' => $price,
                'line_total' => round($price * $quantity, 2),
            ];
        }

        return $lines;
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     * @param  array<string, mixed>  $data
     * @return array{0: float, 1: float} subtotal, discount amount
     */
    private function totals(array $lines, array $data): array
    {
        $subtotal = round(array_sum(array_column($lines, 'line_total')), 2);
        $type = (string) ($data['discount_type'] ?? 'none');
        $value = (float) ($data['discount_value'] ?? 0);

        $discount = match ($type) {
            'percent' => round($subtotal * min(max($value, 0), 100) / 100, 2),
            'fixed' => round(min(max($value, 0), $subtotal), 2),
            default => 0.0,
        };

        return [$subtotal, $discount];
    }

    /**
     * Draws each product off the shelf of the branch selling it, soonest expiry
     * first, and records it in the stock ledger. The action throws when a branch
     * does not hold enough, so the whole sale rolls back.
     *
     * @param  array<int, array<string, mixed>>  $lines
     */
    private function takeStock(array $lines, Branch $branch, string $reference, User $cashier): void
    {
        foreach ($lines as $line) {
            if (! $line['product']) {
                continue;
            }

            try {
                $this->stock->consume($line['product'], $branch, $line['quantity'], 'sale', $cashier, $reference);
            } catch (ValidationException $e) {
                // The message belongs to the cart, not to the quantity field.
                throw ValidationException::withMessages(['items' => $e->validator->errors()->first('quantity')]);
            }
        }
    }

    /** Records money and keeps the sale's running total in step, in the caller's transaction. */
    public function recordPayment(Sale $sale, string $method, float $amount, User $user, ?string $reference = null, string $type = 'payment', ?string $note = null): void
    {
        $signed = $type === 'refund' ? -abs($amount) : abs($amount);

        Payment::create([
            'sale_id' => $sale->id,
            'method' => $method,
            'type' => $type,
            'amount' => $signed,
            'reference' => $reference,
            'note' => $note,
            'user_id' => $user->id,
            'paid_at' => now(),
        ]);

        $sale->refresh();
        $paid = round((float) $sale->payments()->sum('amount'), 2);

        $sale->update([
            'amount_paid' => $paid,
            'status' => $this->statusFor($sale, $paid),
            'paid_at' => $paid > 0 ? ($sale->paid_at ?? now()) : null,
        ]);
    }

    private function statusFor(Sale $sale, float $paid): string
    {
        if ($sale->status === 'void') {
            return 'void';
        }

        $wasRefunded = $sale->payments()->where('type', 'refund')->exists();

        return match (true) {
            $paid <= 0 && $wasRefunded => 'refunded',
            $paid <= 0 => 'unpaid',
            $paid + 0.001 >= $sale->total => 'paid',
            default => 'partial',
        };
    }
}
