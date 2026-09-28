<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One posting: a memo, a date and its debit and credit lines (plan.md §24).
 * Debits must equal credits; nothing else is a journal entry.
 */
class JournalEntry extends Model
{
    use BelongsToOrganization;

    public const SOURCES = [
        'manual' => 'Manual',
        'pos_sale' => 'Counter sale',
        'pos_refund' => 'Counter refund',
        'payroll' => 'Payroll',
        'expense' => 'Expense',
        'adjustment' => 'Adjustment',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['entry_date' => 'date:Y-m-d', 'voided_at' => 'datetime'];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return HasMany<JournalLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }

    /** @param  Builder<JournalEntry>  $query */
    public function scopePosted(Builder $query): void
    {
        $query->where('status', 'posted');
    }

    /** @param  Builder<JournalEntry>  $query */
    public function scopeBetween(Builder $query, string $from, string $to): void
    {
        $query->whereBetween('entry_date', [$from, $to]);
    }

    public function isVoid(): bool
    {
        return $this->status === 'void';
    }

    public function totalDebit(): float
    {
        return round((float) $this->lines()->sum('debit'), 2);
    }

    public function totalCredit(): float
    {
        return round((float) $this->lines()->sum('credit'), 2);
    }

    public function isBalanced(): bool
    {
        return abs($this->totalDebit() - $this->totalCredit()) < 0.01;
    }

    public function sourceLabel(): string
    {
        return self::SOURCES[$this->source_type] ?? $this->source_type;
    }
}
