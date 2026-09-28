<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;

/**
 * A month of books (plan.md §24, §25). Once closed, nothing can be posted into
 * it: a closed month is how a set of books stops moving under you.
 */
class AccountingPeriod extends Model
{
    use BelongsToOrganization;

    public const STATUSES = [
        'open' => 'Open',
        'closed' => 'Closed',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['closed_at' => 'datetime'];
    }

    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    /** Finds or opens the period a date falls in. */
    public static function forDate(string $date): self
    {
        $timestamp = strtotime($date);

        return static::firstOrCreate([
            'year' => (int) date('Y', $timestamp),
            'month' => (int) date('n', $timestamp),
        ], ['status' => 'open']);
    }
}
