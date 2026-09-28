<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One side of a posting: an account, and either a debit or a credit. */
class JournalLine extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['debit' => 'float', 'credit' => 'float'];
    }

    /** @return BelongsTo<JournalEntry, $this> */
    public function entry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    /** @return BelongsTo<Account, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function amount(): float
    {
        return $this->debit > 0 ? $this->debit : $this->credit;
    }
}
