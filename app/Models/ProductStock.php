<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * How much of one product a branch holds (plan.md §21). A fast guard for the
 * register and the low stock alerts, kept in step with the batches by
 * App\Actions\Inventory\ManageStock.
 */
class ProductStock extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['on_hand' => 'integer', 'reorder_level' => 'integer'];
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

    public function isOut(): bool
    {
        return $this->on_hand <= 0;
    }

    /** At or below the reorder level, so the branch should order more. */
    public function isLow(): bool
    {
        return $this->on_hand > 0 && $this->on_hand <= $this->reorder_level;
    }

    public function needsReorder(): bool
    {
        return $this->on_hand <= $this->reorder_level;
    }
}
