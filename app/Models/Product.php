<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A retail product a client can buy at the counter (plan.md §19, §21). */
class Product extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['price' => 'float', 'cost' => 'float', 'is_active' => 'boolean'];
    }

    /** @return HasMany<SaleItem, $this> */
    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /** @return HasMany<ProductBatch, $this> */
    public function batches(): HasMany
    {
        return $this->hasMany(ProductBatch::class);
    }

    /** @return HasMany<ProductStock, $this> */
    public function stocks(): HasMany
    {
        return $this->hasMany(ProductStock::class);
    }

    /** @return HasMany<InventoryMovement, $this> */
    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    /** What a branch holds, or null when the branch was never stocked. */
    public function stockAt(Branch $branch): ?ProductStock
    {
        return $this->stocks->firstWhere('branch_id', $branch->id);
    }

    public function onHandAt(Branch $branch): int
    {
        return (int) ($this->stockAt($branch)?->on_hand ?? 0);
    }

    /** @param  Builder<Product>  $query */
    public function scopeSellable(Builder $query): void
    {
        $query->where('is_active', true);
    }
}
