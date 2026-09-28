<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One line of the stock ledger (plan.md §21): why stock arrived or left, who
 * did it and what it was worth. Every change to a batch writes one of these,
 * so the shelves can always be explained.
 */
class InventoryMovement extends Model
{
    use BelongsToOrganization;

    public const TYPES = [
        'opening' => 'Opening balance',
        'receive' => 'Received',
        'sale' => 'Sold',
        'consume' => 'Used in treatment',
        'return' => 'Returned',
        'adjustment' => 'Adjustment',
        'damage' => 'Damaged',
        'expired' => 'Expired',
        'transfer_in' => 'Transferred in',
        'transfer_out' => 'Transferred out',
    ];

    /** Movements that take stock out of a shelf. */
    public const OUT = ['sale', 'consume', 'damage', 'expired', 'transfer_out', 'adjustment'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['quantity' => 'integer', 'cost' => 'float'];
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** @return BelongsTo<ProductBatch, $this> */
    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isInbound(): bool
    {
        return $this->quantity > 0;
    }
}
