<?php

namespace App\Actions\Inventory;

use App\Models\Branch;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Every change to the shelves goes through here (plan.md §21, §22). A change
 * always does three things together: the batch, the per-branch stock count,
 * and a line in the ledger. Nothing else writes those tables, so the number on
 * the shelf and the number in the books cannot drift apart.
 */
class ManageStock
{
    /** Stock arriving: a new lot on the shelf. */
    public function receive(Product $product, Branch $branch, array $data, User $user, string $type = 'receive'): ProductBatch
    {
        $quantity = max(1, (int) ($data['quantity'] ?? 0));

        return DB::transaction(function () use ($product, $branch, $data, $user, $type, $quantity) {
            $batch = ProductBatch::create([
                'product_id' => $product->id,
                'branch_id' => $branch->id,
                'supplier_id' => $data['supplier_id'] ?? null,
                'lot_number' => $data['lot_number'] ?? null,
                'expires_on' => $data['expires_on'] ?? null,
                'received_on' => $data['received_on'] ?? now()->toDateString(),
                'quantity' => $quantity,
                'cost' => round((float) ($data['cost'] ?? $product->cost), 2),
                'note' => $data['note'] ?? null,
            ]);

            $this->addToShelf($product, $branch, $quantity);
            $this->writeLedger($product, $branch, $batch, $quantity, $type, $user, $data['note'] ?? null, $data['reference'] ?? null);

            return $batch;
        });
    }

    /**
     * Takes stock off the shelf, soonest expiry first (FEFO, plan.md §22). Used
     * by the register and by any correction that removes stock.
     *
     * @return array<int, ProductBatch> the lots it drew from
     *
     * @throws ValidationException
     */
    public function consume(Product $product, Branch $branch, int $quantity, string $type, User $user, ?string $reference = null, ?string $note = null): array
    {
        $quantity = (int) $quantity;

        if ($quantity < 1) {
            throw ValidationException::withMessages(['quantity' => 'Enter how many units to remove.']);
        }

        return DB::transaction(function () use ($product, $branch, $quantity, $type, $user, $reference, $note) {
            $available = (int) $this->stockRow($product, $branch)->on_hand;

            if ($available < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => sprintf(
                        '%s has %d at %s, %d were asked for.',
                        $product->name, $available, $branch->name, $quantity
                    ),
                ]);
            }

            // The conditional update is the concurrency guard: two tills cannot
            // both take the last unit, because only one decrement succeeds.
            $taken = ProductStock::where('product_id', $product->id)
                ->where('branch_id', $branch->id)
                ->where('on_hand', '>=', $quantity)
                ->decrement('on_hand', $quantity);

            if ($taken === 0) {
                throw ValidationException::withMessages([
                    'quantity' => "{$product->name} ran out at {$branch->name} while this was being recorded.",
                ]);
            }

            $drew = [];
            $left = $quantity;

            foreach (ProductBatch::where('product_id', $product->id)
                ->where('branch_id', $branch->id)
                ->inStock()
                ->fefo()
                ->lockForUpdate()
                ->get() as $batch) {
                if ($left <= 0) {
                    break;
                }

                $take = min($batch->quantity, $left);
                $batch->decrement('quantity', $take);
                $left -= $take;
                // The batch now holds what is left, so the amount taken is kept here.
                $drew[] = ['batch' => $batch, 'quantity' => $take];

                $this->writeLedger($product, $branch, $batch, -$take, $type, $user, $note, $reference);
            }

            $this->resync($product, $branch);

            return $drew;
        });
    }

    /** Stock coming back: a client returned it, so a fresh undated lot. */
    public function returnStock(Product $product, Branch $branch, int $quantity, string $reference, User $user): ProductBatch
    {
        return $this->receive($product, $branch, [
            'quantity' => $quantity,
            'note' => "Returned from {$reference}",
            'reference' => $reference,
        ], $user, 'return');
    }

    /**
     * A correction the shelves do not explain on their own: damage, expiry, a
     * miscount found in the stocktake, or stock used in a treatment room.
     */
    public function adjust(Product $product, Branch $branch, string $type, int $quantity, string $note, User $user): void
    {
        if (! in_array($type, ['adjustment', 'damage', 'expired', 'consume'], true)) {
            throw ValidationException::withMessages(['type' => 'That kind of correction is not recorded here.']);
        }

        // More on the shelf than expected: put it in as a correction lot.
        if ($type === 'adjustment' && $quantity > 0) {
            $this->receive($product, $branch, ['quantity' => $quantity, 'note' => $note], $user);

            return;
        }

        $this->consume($product, $branch, abs($quantity), $type, $user, null, $note);
    }

    /** Moves stock from one branch to another without changing the total held. */
    public function transfer(Product $product, Branch $from, Branch $to, int $quantity, User $user): void
    {
        if ($from->is($to)) {
            throw ValidationException::withMessages(['to_branch' => 'Choose a different branch to move the stock to.']);
        }

        $batches = $this->consume($product, $from, $quantity, 'transfer_out', $user, null, "To {$to->name}");

        foreach ($batches as $drawn) {
            $batch = $drawn['batch'];

            $this->receive($product, $to, [
                'quantity' => $drawn['quantity'],
                'lot_number' => $batch->lot_number,
                'expires_on' => $batch->expires_on?->toDateString(),
                'received_on' => now()->toDateString(),
                'cost' => $batch->cost,
                'supplier_id' => $batch->supplier_id,
                'note' => "From {$from->name}",
            ], $user, 'transfer_in');
        }
    }

    /** The per-branch row, created the first time a product is stocked there. */
    private function stockRow(Product $product, Branch $branch): ProductStock
    {
        return ProductStock::firstOrCreate(
            ['product_id' => $product->id, 'branch_id' => $branch->id],
            ['on_hand' => 0, 'reorder_level' => 0],
        );
    }

    private function addToShelf(Product $product, Branch $branch, int $quantity): void
    {
        $this->stockRow($product, $branch)->increment('on_hand', $quantity);
    }

    /**
     * The count on the shelf is the batches summed up. Everything that changes
     * stock finishes here, so the two can never disagree.
     */
    private function resync(Product $product, Branch $branch): void
    {
        $total = (int) ProductBatch::where('product_id', $product->id)
            ->where('branch_id', $branch->id)
            ->sum('quantity');

        $this->stockRow($product, $branch)->update(['on_hand' => $total]);
    }

    private function writeLedger(
        Product $product,
        Branch $branch,
        ?ProductBatch $batch,
        int $quantity,
        string $type,
        User $user,
        ?string $note = null,
        ?string $reference = null,
    ): InventoryMovement {
        return InventoryMovement::create([
            'product_id' => $product->id,
            'branch_id' => $branch->id,
            'batch_id' => $batch?->id,
            'user_id' => $user->id,
            'quantity' => $quantity,
            'type' => $type,
            'cost' => $batch?->cost ?? $product->cost,
            'reference' => $reference ? mb_substr($reference, 0, 40) : null,
            'note' => $note ? mb_substr($note, 0, 200) : null,
        ]);
    }
}
