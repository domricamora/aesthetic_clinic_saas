<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Money against a sale: a payment, or a refund as a negative amount. */
class Payment extends Model
{
    public const METHODS = [
        'cash' => 'Cash',
        'card' => 'Card',
        'bank_transfer' => 'Bank transfer',
        'gcash' => 'GCash',
        'maya' => 'Maya',
        'other' => 'Other',
    ];

    public const TYPES = [
        'payment' => 'Payment',
        'refund' => 'Refund',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['amount' => 'float', 'paid_at' => 'datetime'];
    }

    /** @return BelongsTo<Sale, $this> */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class); // who took the money
    }

    public function methodLabel(): string
    {
        return self::METHODS[$this->method] ?? $this->method;
    }
}
