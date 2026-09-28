import { Head, Link, router, useForm } from '@inertiajs/react';
import { BookOpen, FileText, Lock, LockOpen, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCan } from '@/lib/admin';
import { money } from '@/lib/pos';
import { cn } from '@/lib/utils';
import accounting from '@/routes/admin/accounting';

type Entry = {
    id: number;
    entry_no: string;
    entry_date: string;
    memo: string;
    source_label: string;
    status: string;
    author: string | null;
    debit: number;
};

type Props = {
    from: string;
    to: string;
    cash: number;
    receivable: number;
    payable: number;
    payroll_payable: number;
    revenue: number;
    expenses: number;
    net: number;
    entries: Entry[];
    periods: { id: number; label: string; status: string }[];
    unposted: number;
    sources: Record<string, string>;
};

export default function AccountingIndex(props: Props) {
    const can = useCan();
    const period = useForm({});

    const stat = (label: string, value: string, note?: string) => (
        <div className="border border-border bg-background px-4 py-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-2xl tabular-nums">{value}</p>
            {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
    );

    return (
        <>
            <Head title="Accounting" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {props.from} – {props.to}
                        </p>
                        <h1 className="mt-1 font-display text-3xl md:text-4xl">
                            Accounting
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            type="date"
                            value={props.from}
                            onChange={(e) =>
                                router.get(
                                    accounting.index({
                                        query: {
                                            from: e.target.value,
                                            to: props.to,
                                        },
                                    }).url,
                                    { preserveScroll: true },
                                )
                            }
                            aria-label="From"
                            className="h-10"
                        />
                        <Input
                            type="date"
                            value={props.to}
                            onChange={(e) =>
                                router.get(
                                    accounting.index({
                                        query: {
                                            from: props.from,
                                            to: e.target.value,
                                        },
                                    }).url,
                                    { preserveScroll: true },
                                )
                            }
                            aria-label="To"
                            className="h-10"
                        />
                        <Link
                            href={accounting.accounts().url}
                            className="press inline-flex h-10 items-center gap-2 border border-border bg-background px-4 text-sm hover:bg-mist dark:hover:bg-white/5"
                        >
                            <BookOpen className="h-4 w-4" />
                            Chart
                        </Link>
                        <Link
                            href={accounting.entries().url}
                            className="press inline-flex h-10 items-center gap-2 border border-border bg-background px-4 text-sm hover:bg-mist dark:hover:bg-white/5"
                        >
                            <FileText className="h-4 w-4" />
                            Journal
                        </Link>
                        <Link
                            href={accounting.reports().url}
                            className="press inline-flex h-10 items-center gap-2 border border-border bg-background px-4 text-sm hover:bg-mist dark:hover:bg-white/5"
                        >
                            <Scale className="h-4 w-4" />
                            Reports
                        </Link>
                    </div>
                </header>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {stat('Revenue', money(props.revenue))}
                    {stat('Expenses', money(props.expenses))}
                    {stat(
                        'Net',
                        money(props.net),
                        props.net < 0 ? 'A loss' : undefined,
                    )}
                    {stat('Cash on hand', money(props.cash))}
                    {stat('Receivable', money(props.receivable), 'Owed to us')}
                    {stat('Payable', money(props.payable), 'Owed by us')}
                    {stat(
                        'Payroll payable',
                        money(props.payroll_payable),
                        'Net pay not yet paid',
                    )}
                    {stat(
                        'Unposted sales',
                        String(props.unposted),
                        'Recorded but not in the books',
                    )}
                </div>

                {props.unposted > 0 && (
                    <p className="border border-gold/40 bg-background px-4 py-3 text-sm">
                        {props.unposted} sale{props.unposted === 1 ? '' : 's'}{' '}
                        could not be posted. Check the month is open, then post
                        them from the journal.
                    </p>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <section className="lg:col-span-2">
                        <h2 className="font-display text-xl">
                            Recent postings
                        </h2>
                        <div className="mt-3 overflow-x-auto border border-border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left text-muted-foreground">
                                        <th className="px-4 py-3 font-normal">
                                            Entry
                                        </th>
                                        <th className="px-4 py-3 font-normal">
                                            Memo
                                        </th>
                                        <th className="px-4 py-3 font-normal">
                                            From
                                        </th>
                                        <th className="px-4 py-3 text-right font-normal">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {props.entries.map((entry) => (
                                        <tr
                                            key={entry.id}
                                            className="border-b border-border last:border-0"
                                        >
                                            <td className="px-4 py-3 tabular-nums">
                                                {entry.entry_no}
                                                <span className="block text-xs text-muted-foreground">
                                                    {entry.entry_date}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {entry.memo}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {entry.source_label}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {entry.status === 'void' ? (
                                                    <span className="text-muted-foreground line-through">
                                                        {money(entry.debit)}
                                                    </span>
                                                ) : (
                                                    money(entry.debit)
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {props.entries.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-10 text-center text-muted-foreground"
                                            >
                                                Nothing posted yet. Ring up a
                                                sale or start a pay run.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="font-display text-xl">Periods</h2>
                        <ul className="mt-3 flex flex-col divide-y divide-border border border-border">
                            {props.periods.map((p) => (
                                <li
                                    key={p.id}
                                    className="flex items-center gap-3 px-4 py-3 text-sm"
                                >
                                    <span className="flex-1">{p.label}</span>
                                    <span
                                        className={cn(
                                            'inline-flex border px-2 py-1 text-xs',
                                            p.status === 'closed'
                                                ? 'border-border bg-background text-muted-foreground'
                                                : 'border-plum/30 bg-lilac/60 text-plum',
                                        )}
                                    >
                                        {p.status}
                                    </span>
                                    {can('accounting.create') && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            disabled={period.processing}
                                            onClick={() =>
                                                period.post(
                                                    accounting.periods.toggle(
                                                        p.id,
                                                    ).url,
                                                    { preserveScroll: true },
                                                )
                                            }
                                            aria-label={
                                                p.status === 'closed'
                                                    ? `Reopen ${p.label}`
                                                    : `Close ${p.label}`
                                            }
                                        >
                                            {p.status === 'closed' ? (
                                                <LockOpen className="h-4 w-4" />
                                            ) : (
                                                <Lock className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Closing a month stops anything being posted into it.
                            Reopen it to post a correction.
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}
