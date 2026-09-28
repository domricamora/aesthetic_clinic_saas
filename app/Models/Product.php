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
        return ['price' => 'float',
            'cost' => 'float',
            'stock_on_hand' => 'integer',
            'reorder_level' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'id';
    }

    /** @return HasMany<SaleItem, $this> */
    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function isInStock(): bool
    {
        return $this->stock_on_hand > 0;
    }

    public function isLow(): bool
    {
        return $this->stock_on_hand <= $this->reorder_level;
    }

    /** @param  Builder<Product>  $query */
    public function scopeSellable(Builder $query): void
    {
        $query->where('is_active', true);
    }
}
