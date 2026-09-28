import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Banknote, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCan } from '@/lib/admin';
import type { Labels } from '@/lib/admin';
import type { PayslipRow } from '@/lib/people';
import { personTone } from '@/lib/people';
import { money } from '@/lib/pos';
import { cn } from '@/lib/utils';
import payroll from '@/routes/admin/payroll';

type Props = {
    run: {
        id: number;
        label: string;
        period_start: string;
        period_end: string;
        paid_on: string;
        status: string;
        preparer: string | null;
        total_gross: number;
        total_deductions: number;
        total_net: number;
        posted_at: string | null;
    };
    payslips: PayslipRow[];
    totals: {
        sss: number;
        philhealth: number;
        pagibig: number;
        withholding_tax: number;
        overtime: number;
    };
    statuses: Labels;
};

export default function PayrollRun({ run, payslips, totals, statuses }: Props) {
    const can = useCan();
    const approve = useForm({});
    const pay = useForm({});

    const stat = (label: string, value: string) => (
        <div className="border border-border bg-background px-4 py-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-2xl tabular-nums">{value}</p>
        </div>
    );

    return (
        <>
            <Head title={run.label} />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Link
                            href={payroll.index().url}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Payroll
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <h1 className="font-display text-3xl md:text-4xl">
                                {run.label}
                            </h1>
                            <span
                                className={cn(
                                    'inline-flex border px-2 py-1 text-xs',
                                    personTone(run.status),
                                )}
                            >
                                {statuses[run.status] ?? run.status}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {run.period_start} – {run.period_end} · paid{' '}
                            {run.paid_on}
                            {run.preparer
                                ? ` · prepared by ${run.preparer}`
                                : ''}
                        </p>
                    </div>

                    {can('payroll.create') && (
                        <div className="flex flex-wrap gap-2">
                            {run.status === 'draft' && (
                                <Button
                                    type="button"
                                    disabled={approve.processing}
                                    onClick={() =>
                                        approve.post(
                                            payroll.approve(run.id).url,
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="h-10 bg-plum text-white hover:bg-plum-deep"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve and post
                                </Button>
                            )}
                            {run.status === 'approved' && (
                                <Button
                                    type="button"
                                    disabled={pay.processing}
                                    onClick={() =>
                                        pay.post(payroll.pay(run.id).url, {
                                            preserveScroll: true,
                                        })
                                    }
                                    className="h-10 bg-plum text-white hover:bg-plum-deep"
                                >
                                    <Banknote className="h-4 w-4" />
                                    Mark as paid
                                </Button>
                            )}
                        </div>
                    )}
                </header>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {stat('Gross', money(run.total_gross))}
                    {stat('Deductions', money(run.total_deductions))}
                    {stat('Net', money(run.total_net))}
                    {stat('Overtime paid', money(totals.overtime))}
                    {stat('People', String(payslips.length))}
                </div>

                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {stat('SSS', money(totals.sss))}
                    {stat('PhilHealth', money(totals.philhealth))}
                    {stat('Pag-IBIG', money(totals.pagibig))}
                    {stat('Withholding tax', money(totals.withholding_tax))}
                </section>

                <div className="overflow-x-auto border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="px-4 py-3 font-normal">
                                    Employee
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Days
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Basic
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Overtime
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Gross
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    SSS
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    PhilHealth
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Pag-IBIG
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Tax
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Net
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {payslips.map((slip) => (
                                <tr
                                    key={slip.id}
                                    className="border-b border-border last:border-0"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={payroll.payslip(slip.id).url}
                                            className="underline underline-offset-4 hover:text-plum"
                                        >
                                            {slip.employee}
                                        </Link>
                                        <span className="block text-xs text-muted-foreground">
                                            {slip.position}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {slip.days_paid}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(slip.basic)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {slip.overtime > 0
                                            ? money(slip.overtime)
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(slip.gross)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                        {money(slip.sss)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                        {money(slip.philhealth)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                        {money(slip.pagibig)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                        {money(slip.withholding_tax)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {money(slip.net)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-border">
                                <td className="px-4 py-3 font-medium">
                                    Totals
                                </td>
                                <td colSpan={3} />
                                <td className="px-4 py-3 text-right font-medium tabular-nums">
                                    {money(run.total_gross)}
                                </td>
                                <td colSpan={4} />
                                <td className="px-4 py-3 text-right font-medium tabular-nums">
                                    {money(run.total_net)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </>
    );
}
