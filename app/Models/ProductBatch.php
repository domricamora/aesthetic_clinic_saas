<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A lot of one product at one branch (plan.md §21). Batches are the physical
 * stock: the number on the shelf, what it cost and when it expires. Stock is
 * taken from the soonest expiry first, so this is ordered by expires_on.
 *
 * @property CarbonImmutable|null $expires_on
 */
class ProductBatch extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['expires_on' => 'date:Y-m-d',
            'received_on' => 'date:Y-m-d',
            'quantity' => 'integer',
            'cost' => 'float',
        ];
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

    /** @return BelongsTo<Supplier, $this> */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /** @param  Builder<ProductBatch>  $query */
    public function scopeInStock(Builder $query): void
    {
        $query->where('quantity', '>', 0);
    }

    /** FEFO order: soonest expiry first, and stock with no expiry last. */
    /** @param  Builder<ProductBatch>  $query */
    public function scopeFefo(Builder $query): void
    {
        // 0 sorts before 1, so dated lots come first and undated stock last.
        $query->orderByRaw('expires_on is null')
            ->orderBy('expires_on')
            ->orderBy('received_on')
            ->orderBy('id');
    }

    public function isExpired(): bool
    {
        return $this->expires_on !== null && $this->expires_on->isPast();
    }

    /** Within a month of its date, which is when it needs using up. */
    public function isExpiringSoon(): bool
    {
        return $this->expires_on !== null
            && ! $this->isExpired()
            && $this->expires_on->lte(today()->addDays(30));
    }

    /** Days left before it expires, negative once it has. */
    public function daysToExpiry(): ?int
    {
        return $this->expires_on === null
            ? null
            : (int) today()->diffInDays($this->expires_on, false);
    }
}
