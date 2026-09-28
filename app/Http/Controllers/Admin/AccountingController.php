<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Accounting\PostEntry;
use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AccountingPeriod;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Sale;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The books (plan.md §24): a chart of accounts, the journal, and the three
 * statements that fall out of it. Entries are never edited; a wrong one is
 * voided so the trail stays readable.
 */
class AccountingController extends Controller
{
    public function index(Request $request): Response
    {
        $to = CarbonImmutable::parse($request->date('to') ?? now()->toDateString());
        $from = CarbonImmutable::parse($request->date('from') ?? $to->startOfMonth()->toDateString());

        return Inertia::render('admin/accounting/index', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'cash' => $this->balanceOf('1000', $from, $to),
            'receivable' => $this->balanceOf('1200', $from, $to),
            'payable' => $this->balanceOf('2000', $from, $to),
            'payroll_payable' => $this->balanceOf('2200', $from, $to),
            'revenue' => $this->income('revenue', $from, $to),
            'expenses' => $this->income('expense', $from, $to),
            'net' => round($this->income('revenue', $from, $to) - $this->income('expense', $from, $to), 2),
            'entries' => JournalEntry::with('author:id,name')->latest('entry_date')->latest('id')->limit(10)->get()
                ->map(fn (JournalEntry $e) => $this->entryPayload($e)),
            'periods' => AccountingPeriod::orderByDesc('year')->orderByDesc('month')->limit(6)->get()
                ->map(fn (AccountingPeriod $p) => [
                    'id' => $p->id,
                    'label' => date('F Y', mktime(0, 0, 0, $p->month, 1, $p->year)),
                    'status' => $p->status,
                ]),
            'unposted' => Sale::whereNotNull('note')->where('note', 'like', '%Not posted%')->count(),
            'sources' => JournalEntry::SOURCES,
        ]);
    }

    public function accounts(): Response
    {
        return Inertia::render('admin/accounting/accounts', [
            'accounts' => Account::withCount('lines')->orderBy('sort')->get()
                ->map(fn (Account $a) => [
                    'id' => $a->id,
                    'code' => $a->code,
                    'name' => $a->name,
                    'type' => $a->type,
                    'normal_balance' => $a->normal_balance,
                    'balance' => $a->balance(),
                    'is_system' => $a->is_system,
                    'is_active' => $a->is_active,
                ]),
            'types' => Account::TYPES,
        ]);
    }

    public function entries(Request $request): Response
    {
        return Inertia::render('admin/accounting/entries', [
            'entries' => JournalEntry::with('author:id,name')->withSum('lines', 'debit')
                ->latest('entry_date')->latest('id')->limit(60)->get()
                ->map(fn (JournalEntry $e) => $this->entryPayload($e)),
            'accounts' => Account::postable()->orderBy('sort')->get(['id', 'code', 'name', 'type']),
            'sources' => JournalEntry::SOURCES,
        ]);
    }

    public function store(Request $request, PostEntry $post): RedirectResponse
    {
        $data = $request->validate([
            'entry_date' => ['required', 'date', 'before_or_equal:today'],
            'memo' => ['required', 'string', 'max:200'],
            'lines' => ['required', 'array', 'min:2'],
            'lines.*.account' => ['required', 'string'],
            'lines.*.debit' => ['nullable', 'numeric', 'min:0'],
            'lines.*.credit' => ['nullable', 'numeric', 'min:0'],
            'lines.*.memo' => ['nullable', 'string', 'max:200'],
        ]);

        $post($data['lines'], $data + ['source_type' => 'manual'], $request->user());

        return back()->with('success', 'Journal entry posted.');
    }

    /** A wrong entry is voided, never edited: the trail has to stay readable. */
    public function void(Request $request, JournalEntry $entry): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:200']]);

        if ($entry->isVoid()) {
            return back()->with('error', 'That entry is already void.');
        }

        $entry->update(['status' => 'void', 'voided_at' => now(), 'void_reason' => $data['reason']]);

        return back()->with('success', $entry->entry_no.' voided.');
    }

    /** Trial balance, income statement and balance sheet from the same journal. */
    public function reports(Request $request): Response
    {
        $to = CarbonImmutable::parse($request->date('to') ?? now()->toDateString());
        $from = CarbonImmutable::parse($request->date('from') ?? CarbonImmutable::createFromDate($to->year, 1, 1)->toDateString());
        $since = CarbonImmutable::createFromDate($to->year, 1, 1);

        $balances = Account::orderBy('sort')->get()
            ->map(fn (Account $a) => [
                'code' => $a->code,
                'name' => $a->name,
                'type' => $a->type,
                'normal_balance' => $a->normal_balance,
                'period' => $this->signedBetween($a, $from, $to),
                'year' => $this->signedBetween($a, $since, $to),
            ]);

        $withMoney = fn (string $type) => $balances->filter(fn ($b) => $b['type'] === $type && abs($b['year']) > 0.005);
        $revenue = round((float) $withMoney('revenue')->sum('year'), 2);
        $expenses = round((float) $withMoney('expense')->sum('year'), 2);

        $assets = round((float) $balances->where('type', 'asset')->sum('year'), 2);
        $liabilities = round((float) $balances->where('type', 'liability')->sum('year'), 2);
        $equity = round((float) $balances->where('type', 'equity')->sum('year'), 2);

        return Inertia::render('admin/accounting/reports', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'trial_balance' => $balances->filter(fn ($b) => abs($b['year']) > 0.005)->values(),
            'trial_totals' => [
                'debit' => round((float) $balances->filter(fn ($b) => $b['year'] > 0)->sum('year'), 2),
                'credit' => round((float) $balances->filter(fn ($b) => $b['year'] < 0)->sum('year') * -1, 2),
            ],
            'income_statement' => [
                'revenue' => $withMoney('revenue')->values(),
                'expenses' => $withMoney('expense')->values(),
                'total_revenue' => $revenue,
                'total_expenses' => $expenses,
                'net' => round($revenue - $expenses, 2),
            ],
            'balance_sheet' => [
                'assets' => $balances->where('type', 'asset')->filter(fn ($b) => abs($b['year']) > 0.005)->values(),
                'liabilities' => $balances->where('type', 'liability')->filter(fn ($b) => abs($b['year']) > 0.005)->values(),
                'equity' => $balances->where('type', 'equity')->filter(fn ($b) => abs($b['year']) > 0.005)->values(),
                'total_assets' => $assets,
                'total_liabilities' => $liabilities,
                'total_equity' => $equity,
                'retained' => round($revenue - $expenses, 2),
                'balances' => abs($assets - ($liabilities + $equity + ($revenue - $expenses))) < 0.05,
            ],
        ]);
    }

    /** Closing a month is how a set of books stops moving under you. */
    public function togglePeriod(Request $request, AccountingPeriod $period): RedirectResponse
    {
        $closing = ! $period->isClosed();

        $period->update([
            'status' => $closing ? 'closed' : 'open',
            'closed_at' => $closing ? now() : null,
            'closed_by' => $closing ? $request->user()->id : null,
        ]);

        return back()->with('success', $closing ? 'Period closed.' : 'Period reopened.');
    }

    /** @return array<string, mixed> */
    private function entryPayload(JournalEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'entry_no' => $entry->entry_no,
            'entry_date' => $entry->entry_date->toDateString(),
            'memo' => $entry->memo,
            'source_type' => $entry->source_type,
            'source_label' => $entry->sourceLabel(),
            'source_id' => $entry->source_id,
            'status' => $entry->status,
            'author' => $entry->author?->name,
            'debit' => $entry->lines->sum('debit') ?: (float) ($entry->lines_sum_debit ?? 0),
        ];
    }

    /** An account balance on its normal side, over a window. */
    private function balanceOf(string $code, CarbonImmutable $from, CarbonImmutable $to): float
    {
        $account = Account::where('code', $code)->first();

        return $account ? $this->signedBetween($account, $from, $to) : 0.0;
    }

    private function income(string $type, CarbonImmutable $from, CarbonImmutable $to): float
    {
        $debit = (float) JournalLine::whereIn('account_id', Account::ofType($type)->pluck('id'))
            ->whereHas('entry', fn ($q) => $q->posted()->between($from->toDateString(), $to->toDateString()))
            ->sum('debit');
        $credit = (float) JournalLine::whereIn('account_id', Account::ofType($type)->pluck('id'))
            ->whereHas('entry', fn ($q) => $q->posted()->between($from->toDateString(), $to->toDateString()))
            ->sum('credit');

        // Revenue and expenses both grow on the credit side.
        return round($type === 'revenue' ? $credit - $debit : $debit - $credit, 2);
    }

    private function signedBetween(Account $account, CarbonImmutable $from, CarbonImmutable $to): float
    {
        $lines = JournalLine::where('account_id', $account->id)
            ->whereHas('entry', fn ($q) => $q->posted()->between($from->toDateString(), $to->toDateString()));

        $balance = round((float) $lines->sum('debit') - (float) $lines->sum('credit'), 2);

        return $account->normal_balance === 'debit' ? $balance : round(-$balance, 2);
    }
}
