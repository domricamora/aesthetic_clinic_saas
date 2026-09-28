<?php

namespace App\Actions\Accounting;

use App\Models\Account;
use App\Models\AccountingPeriod;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The one way anything reaches the books (plan.md §24). Every posting goes
 * through here, so nothing can be half entered: debits must equal credits, the
 * accounts have to be real, the month has to be open, and a source can only be
 * posted once. A record that has already been posted is never edited, it is
 * voided and re-posted.
 */
class PostEntry
{
    /**
     * @param  array<int, array{account: string, debit?: float, credit?: float, memo?: string|null}>  $lines  account codes
     *
     * @throws ValidationException
     */
    public function __invoke(array $lines, array $attributes, User $user): JournalEntry
    {
        $date = (string) ($attributes['entry_date'] ?? now()->toDateString());
        $lines = $this->cleanLines($lines);

        if (count($lines) < 2) {
            throw ValidationException::withMessages(['lines' => 'A journal entry needs at least two lines.']);
        }

        $debit = round(array_sum(array_column($lines, 'debit')), 2);
        $credit = round(array_sum(array_column($lines, 'credit')), 2);

        if ($debit < 0.01 || $credit < 0.01) {
            throw ValidationException::withMessages(['lines' => 'Every entry has to move something.']);
        }

        if (abs($debit - $credit) > 0.01) {
            throw ValidationException::withMessages([
                'lines' => sprintf('Debits of %s do not match credits of %s.', number_format($debit, 2), number_format($credit, 2)),
            ]);
        }

        $period = AccountingPeriod::forDate($date);

        if ($period->isClosed()) {
            throw ValidationException::withMessages([
                'entry_date' => sprintf('%s is closed. Reopen the period before posting into it.', date('F Y', mktime(0, 0, 0, $period->month, 1, $period->year))),
            ]);
        }

        $accounts = Account::whereIn('code', array_column($lines, 'account'))->get()->keyBy('code');
        $missing = array_diff(array_column($lines, 'account'), $accounts->keys()->all());

        if ($missing !== []) {
            throw ValidationException::withMessages(['lines' => 'Unknown account: '.implode(', ', $missing).'.']);
        }

        if ($accounts->first(fn (Account $a) => ! $a->is_active) !== null) {
            throw ValidationException::withMessages(['lines' => 'One of those accounts is no longer active.']);
        }

        $sourceType = (string) ($attributes['source_type'] ?? 'manual');
        $sourceId = $attributes['source_id'] ?? null;

        if ($sourceId !== null && JournalEntry::withoutGlobalScopes()
            ->where('organization_id', Organization::current()?->id)
            ->where('source_type', $sourceType)
            ->where('source_id', (string) $sourceId)
            ->where('status', 'posted')
            ->exists()) {
            throw ValidationException::withMessages(['lines' => 'That record has already been posted to the books.']);
        }

        return DB::transaction(function () use ($lines, $attributes, $user, $date, $sourceType, $sourceId, $accounts) {
            $entry = JournalEntry::create([
                'user_id' => $user->id,
                'entry_no' => $this->nextEntryNo($date),
                'entry_date' => $date,
                'memo' => (string) ($attributes['memo'] ?? 'Journal entry'),
                'source_type' => $sourceType,
                'source_id' => $sourceId === null ? null : (string) $sourceId,
                'status' => 'posted',
            ]);

            foreach ($lines as $line) {
                JournalLine::create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $accounts[$line['account']]->id,
                    'debit' => $line['debit'],
                    'credit' => $line['credit'],
                    'memo' => $line['memo'] ?? null,
                ]);
            }

            return $entry->load('lines');
        });
    }

    /** A one-line lookup by code, for the modules that post their own entries. */
    public function account(string $code): Account
    {
        $account = Account::where('code', $code)->first();

        if (! $account) {
            throw ValidationException::withMessages(['lines' => "Account {$code} is missing from the chart."]);
        }

        return $account;
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     * @return array<int, array{account: string, debit: float, credit: float, memo: string|null}>
     */
    private function cleanLines(array $lines): array
    {
        $clean = [];

        foreach ($lines as $line) {
            $debit = round((float) ($line['debit'] ?? 0), 2);
            $credit = round((float) ($line['credit'] ?? 0), 2);

            if ($debit < 0.01 && $credit < 0.01) {
                continue; // a row nobody filled in is not a mistake
            }

            $clean[] = [
                'account' => (string) $line['account'],
                'debit' => $debit,
                'credit' => $credit,
                'memo' => $line['memo'] ?? null,
            ];
        }

        return $clean;
    }

    /** JE-2026-09-0007, running for the organization. */
    private function nextEntryNo(string $date): string
    {
        $prefix = 'JE-'.date('Y-m', strtotime($date));

        do {
            $number = $prefix.'-'.str_pad((string) (JournalEntry::withoutGlobalScopes()->where('entry_no', 'like', $prefix.'-%')->count() + 1), 4, '0', STR_PAD_LEFT);
        } while (JournalEntry::withoutGlobalScopes()->where('entry_no', $number)->exists());

        return $number;
    }
}
