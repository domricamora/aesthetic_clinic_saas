<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * One completed checkout (plan.md §19). Totals are calculated on the server from
 * catalogue prices, never from what the browser sent, and amount_paid is kept in
 * step with the payments rows inside the same transaction.
 */
class Sale extends Model
{
    use BelongsToOrganization;

    public const STATUSES = [
        'unpaid' => 'Unpaid',
        'partial' => 'Part paid',
        'paid' => 'Paid',
        'refunded' => 'Refunded',
        'void' => 'Void',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['subtotal' => 'float',
            'discount_value' => 'float',
            'discount_amount' => 'float',
            'total' => 'float',
            'amount_paid' => 'float',
            'paid_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class); // the cashier
    }

    /** @return BelongsTo<Lead, $this> */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /** @return BelongsTo<Promotion, $this> */
    public function promotion(): BelongsTo
    {
        return $this->belongsTo(Promotion::class);
    }

    /** @return HasMany<SaleItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function getBalanceAttribute(): float
    {
        return round($this->total - $this->amount_paid, 2);
    }

    public function isSettled(): bool
    {
        return $this->amount_paid + 0.001 >= $this->total;
    }

    /** Short, human, and unique enough to read out at the counter. */
    public static function nextReference(): string
    {
        do {
            $reference = 'POS-'.now()->format('ymd').'-'.strtoupper(Str::random(4));
        } while (self::where('reference', $reference)->exists());

        return $reference;
    }
}
