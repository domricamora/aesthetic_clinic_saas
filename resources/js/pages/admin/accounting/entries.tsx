import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Ban, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
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
    entries: Entry[];
    accounts: { id: number; code: string; name: string; type: string }[];
};

type Line = { account: string; debit: string; credit: string; memo: string };

const blankLine = (): Line => ({
    account: '',
    debit: '',
    credit: '',
    memo: '',
});

export default function AccountingEntries({ entries, accounts }: Props) {
    const can = useCan();
    const [open, setOpen] = useState(false);
    const form = useForm<{ entry_date: string; memo: string; lines: Line[] }>({
        entry_date: new Date().toISOString().slice(0, 10),
        memo: '',
        lines: [blankLine(), blankLine()],
    });
    const voidForm = useForm({ reason: '' });

    const debits = form.data.lines.reduce(
        (sum, line) => sum + Number(line.debit || 0),
        0,
    );
    const credits = form.data.lines.reduce(
        (sum, line) => sum + Number(line.credit || 0),
        0,
    );
    const difference = Math.round((debits - credits) * 100) / 100;

    const updateLine = (index: number, patch: Partial<Line>) =>
        form.setData(
            'lines',
            form.data.lines.map((line, i) =>
                i === index ? { ...line, ...patch } : line,
            ),
        );

    const post = () =>
        form.post(accounting.entries.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.setData({
                    entry_date: new Date().toISOString().slice(0, 10),
                    memo: '',
                    lines: [blankLine(), blankLine()],
                });
            },
        });

    return (
        <>
            <Head title="Journal" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Link
                            href={accounting.index().url}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Accounting
                        </Link>
                        <h1 className="mt-2 font-display text-3xl md:text-4xl">
                            Journal
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Every posting, oldest at the bottom. Nothing is
                            edited: a wrong entry is voided.
                        </p>
                    </div>
                    {can('accounting.create') && (
                        <Button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            className="h-10 bg-plum text-white hover:bg-plum-deep"
                        >
                            {open ? (
                                <X className="h-4 w-4" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            {open ? 'Cancel' : 'New entry'}
                        </Button>
                    )}
                </header>

                {open && (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            post();
                        }}
                        className="border border-border bg-background p-6"
                    >
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="grid gap-1">
                                <Label htmlFor="entry_date">Date</Label>
                                <Input
                                    id="entry_date"
                                    type="date"
                                    value={form.data.entry_date}
                                    onChange={(e) =>
                                        form.setData(
                                            'entry_date',
                                            e.target.value,
                                        )
                                    }
                                />
                                {form.errors.entry_date && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.entry_date}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-1 sm:col-span-2">
                                <Label htmlFor="memo">Memo</Label>
                                <Input
                                    id="memo"
                                    value={form.data.memo}
                                    onChange={(e) =>
                                        form.setData('memo', e.target.value)
                                    }
                                    placeholder="What this posting is for"
                                    required
                                />
                                {form.errors.memo && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.memo}
                                    </p>
                                )}
                            </div>
                        </div>

                        <table className="mt-5 w-full text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground">
                                    <th className="pb-2 font-normal">
                                        Account
                                    </th>
                                    <th className="w-32 pb-2 text-right font-normal">
                                        Debit
                                    </th>
                                    <th className="w-32 pb-2 text-right font-normal">
                                        Credit
                                    </th>
                                    <th className="w-40 pb-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {form.data.lines.map((line, index) => (
                                    <tr key={index}>
                                        <td className="py-1 pr-2">
                                            <select
                                                aria-label={`Account for line ${index + 1}`}
                                                value={line.account}
                                                onChange={(e) =>
                                                    updateLine(index, {
                                                        account: e.target.value,
                                                    })
                                                }
                                                className="h-9 w-full border border-border bg-background px-2 text-sm"
                                            >
                                                <option value="">
                                                    Choose an account
                                                </option>
                                                {accounts.map((account) => (
                                                    <option
                                                        key={account.id}
                                                        value={account.code}
                                                    >
                                                        {account.code} ·{' '}
                                                        {account.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-1 pl-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                aria-label={`Debit for line ${index + 1}`}
                                                value={line.debit}
                                                onChange={(e) =>
                                                    updateLine(index, {
                                                        debit: e.target.value,
                                                        credit: '',
                                                    })
                                                }
                                                className="h-9 text-right tabular-nums"
                                            />
                                        </td>
                                        <td className="py-1 pl-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                aria-label={`Credit for line ${index + 1}`}
                                                value={line.credit}
                                                onChange={(e) =>
                                                    updateLine(index, {
                                                        credit: e.target.value,
                                                        debit: '',
                                                    })
                                                }
                                                className="h-9 text-right tabular-nums"
                                            />
                                        </td>
                                        <td className="py-1 pl-2 text-right">
                                            {form.data.lines.length > 2 && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        form.setData(
                                                            'lines',
                                                            form.data.lines.filter(
                                                                (_, i) =>
                                                                    i !== index,
                                                            ),
                                                        )
                                                    }
                                                    aria-label={`Remove line ${index + 1}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-border text-sm">
                                    <td className="pt-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                form.setData('lines', [
                                                    ...form.data.lines,
                                                    blankLine(),
                                                ])
                                            }
                                        >
                                            <Plus className="h-3 w-3" />
                                            Line
                                        </Button>
                                    </td>
                                    <td className="pt-2 text-right tabular-nums">
                                        {money(debits)}
                                    </td>
                                    <td className="pt-2 text-right tabular-nums">
                                        {money(credits)}
                                    </td>
                                    <td
                                        className={cn(
                                            'pt-2 pl-2 text-right tabular-nums',
                                            difference !== 0 &&
                                                'text-destructive',
                                        )}
                                    >
                                        {difference === 0
                                            ? 'Balanced'
                                            : money(Math.abs(difference)) +
                                              ' off'}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>

                        {form.errors.lines && (
                            <p className="mt-3 text-sm text-destructive">
                                {form.errors.lines}
                            </p>
                        )}

                        <Button
                            type="submit"
                            disabled={form.processing || difference !== 0}
                            className="mt-4 h-10 bg-plum text-white hover:bg-plum-deep"
                        >
                            {form.processing && <Spinner />}
                            Post entry
                        </Button>
                    </form>
                )}

                <div className="overflow-x-auto border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="px-4 py-3 font-normal">Entry</th>
                                <th className="px-4 py-3 font-normal">Memo</th>
                                <th className="px-4 py-3 font-normal">
                                    Source
                                </th>
                                <th className="px-4 py-3 font-normal">By</th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Amount
                                </th>
                                <th className="px-4 py-3 font-normal" />
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
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
                                    <td
                                        className={cn(
                                            'px-4 py-3',
                                            entry.status === 'void' &&
                                                'text-muted-foreground line-through',
                                        )}
                                    >
                                        {entry.memo}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {entry.source_label}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {entry.author ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(entry.debit)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {can('accounting.create') &&
                                            entry.status !== 'void' && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={
                                                        voidForm.processing
                                                    }
                                                    onClick={() => {
                                                        voidForm.setData(
                                                            'reason',
                                                            'Voided from the journal',
                                                        );
                                                        voidForm.post(
                                                            accounting.entries.void(
                                                                entry.id,
                                                            ).url,
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                    }}
                                                    aria-label={`Void ${entry.entry_no}`}
                                                >
                                                    <Ban className="h-4 w-4" />
                                                </Button>
                                            )}
                                    </td>
                                </tr>
                            ))}
                            {entries.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        No entries yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
