import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useCan } from '@/lib/admin';
import type { Labels } from '@/lib/admin';
import { personTone } from '@/lib/people';
import { money } from '@/lib/pos';
import { cn } from '@/lib/utils';
import payroll from '@/routes/admin/payroll';

type Run = {
    id: number;
    label: string;
    period_start: string;
    period_end: string;
    paid_on: string;
    status: string;
    headcount: number;
    total_gross: number;
    total_net: number;
};

type Props = {
    runs: Run[];
    statuses: Labels;
    staff: number;
    monthly_payroll: number;
};

const monthStart = () => new Date().toISOString().slice(0, 8) + '01';
const monthEnd = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
};

export default function PayrollIndex({
    runs,
    statuses,
    staff,
    monthly_payroll,
}: Props) {
    const can = useCan();
    const [open, setOpen] = useState(false);
    const form = useForm({
        label: `Payroll ${new Date().toLocaleString('en-PH', { month: 'long', year: 'numeric' })}`,
        period_start: monthStart(),
        period_end: monthEnd(),
        paid_on: monthEnd(),
    });

    return (
        <>
            <Head title="Payroll" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {staff} on the roll
                        </p>
                        <h1 className="mt-1 font-display text-3xl md:text-4xl">
                            Payroll
                        </h1>
                    </div>
                    {can('payroll.create') && (
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
                            {open ? 'Cancel' : 'Start a pay run'}
                        </Button>
                    )}
                </header>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="border border-border bg-background px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                            Monthly payroll
                        </p>
                        <p className="font-display text-2xl tabular-nums">
                            {money(monthly_payroll)}
                        </p>
                    </div>
                    <div className="border border-border bg-background px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                            Pay runs
                        </p>
                        <p className="font-display text-2xl tabular-nums">
                            {runs.length}
                        </p>
                    </div>
                </div>

                {open && (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(payroll.store().url, {
                                preserveScroll: true,
                            });
                        }}
                        className="grid max-w-3xl gap-4 border border-border bg-background p-6 sm:grid-cols-2"
                    >
                        <div className="grid gap-1 sm:col-span-2">
                            <Label htmlFor="label">Run name</Label>
                            <Input
                                id="label"
                                value={form.data.label}
                                onChange={(e) =>
                                    form.setData('label', e.target.value)
                                }
                                required
                            />
                            {form.errors.label && (
                                <p className="text-sm text-destructive">
                                    {form.errors.label}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="period_start">Period from</Label>
                            <Input
                                id="period_start"
                                type="date"
                                value={form.data.period_start}
                                onChange={(e) =>
                                    form.setData('period_start', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="period_end">Period to</Label>
                            <Input
                                id="period_end"
                                type="date"
                                value={form.data.period_end}
                                onChange={(e) =>
                                    form.setData('period_end', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="paid_on">Paid on</Label>
                            <Input
                                id="paid_on"
                                type="date"
                                value={form.data.paid_on}
                                onChange={(e) =>
                                    form.setData('paid_on', e.target.value)
                                }
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="h-10 bg-plum text-white hover:bg-plum-deep"
                            >
                                {form.processing && <Spinner />}
                                Calculate
                            </Button>
                        </div>
                        {form.errors.period_end && (
                            <p className="text-sm text-destructive sm:col-span-2">
                                {form.errors.period_end}
                            </p>
                        )}
                    </form>
                )}

                <div className="overflow-x-auto border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="px-4 py-3 font-normal">Run</th>
                                <th className="px-4 py-3 font-normal">
                                    Period
                                </th>
                                <th className="px-4 py-3 font-normal">Paid</th>
                                <th className="px-4 py-3 text-right font-normal">
                                    People
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Gross
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Net
                                </th>
                                <th className="px-4 py-3 font-normal">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {runs.map((run) => (
                                <tr
                                    key={run.id}
                                    className="border-b border-border last:border-0"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={payroll.show(run.id).url}
                                            className="underline underline-offset-4 hover:text-plum"
                                        >
                                            {run.label}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                                        {run.period_start} – {run.period_end}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                                        {run.paid_on}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {run.headcount}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(run.total_gross)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(run.total_net)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={cn(
                                                'inline-flex border px-2 py-1 text-xs',
                                                personTone(run.status),
                                            )}
                                        >
                                            {statuses[run.status] ?? run.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {runs.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        No pay run yet. Start one to calculate
                                        the month.
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
