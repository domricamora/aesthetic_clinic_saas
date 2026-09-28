<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One line of the chart of accounts (plan.md §24). */
class Account extends Model
{
    use BelongsToOrganization;

    public const TYPES = [
        'asset' => 'Assets',
        'liability' => 'Liabilities',
        'equity' => 'Equity',
        'revenue' => 'Revenue',
        'expense' => 'Expenses',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['is_system' => 'boolean', 'is_active' => 'boolean', 'sort' => 'integer'];
    }

    /** @return HasMany<JournalLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }

    /** Lines that still count: a voided entry is not in the balance. */
    public function postedLines(): HasMany
    {
        return $this->hasMany(JournalLine::class)->whereHas('entry', fn (Builder $q) => $q->where('status', 'posted'));
    }

    /** @param  Builder<Account>  $query */
    public function scopePostable(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /** @param  Builder<Account>  $query */
    public function scopeOfType(Builder $query, string $type): void
    {
        $query->where('type', $type);
    }

    /** Debit less credit: the raw movement on this account, voided entries aside. */
    public function balance(): float
    {
        return round((float) $this->postedLines()->sum('debit') - (float) $this->postedLines()->sum('credit'), 2);
    }

    /** The same figure on the side the account normally sits on, as a report shows it. */
    public function signedBalance(): float
    {
        return $this->normal_balance === 'debit' ? $this->balance() : round(-$this->balance(), 2);
    }
}
