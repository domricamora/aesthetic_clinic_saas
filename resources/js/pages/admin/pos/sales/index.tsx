import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Labels } from '@/lib/admin';
import { formatDate } from '@/lib/admin';
import type { SaleRow } from '@/lib/pos';
import { money, statusTone } from '@/lib/pos';
import { manilaNow, toIsoDate } from '@/lib/site';
import pos from '@/routes/admin/pos';

type Props = {
    date: string;
    branch: number | null;
    branches: { id: number; name: string }[];
    sales: SaleRow[];
    summary: { count: number; total: number; paid: number; due: number };
    statuses: Labels;
};

const shift = (date: string, days: number): string => {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + days);

    return toIsoDate(d);
};

const stat = (label: string, value: string): React.JSX.Element => (
    <div className="border border-border bg-background px-4 py-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-2xl tabular-nums">{value}</p>
    </div>
);

export default function PosSales({
    date,
    branch,
    branches,
    sales,
    summary,
    statuses,
}: Props) {
    const today = toIsoDate(manilaNow());
    const url = (day: string, branchId: number | null) =>
        pos.sales.index({
            query: { date: day, branch: branchId ?? undefined },
        }).url;

    return (
        <>
            <Head title="Sales" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {summary.count}{' '}
                            {summary.count === 1 ? 'sale' : 'sales'}
                            {date === today && ' today'}
                        </p>
                        <h1 className="mt-1 font-display text-3xl md:text-4xl">
                            Sales
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center border border-border">
                            <Link
                                href={url(shift(date, -1), branch)}
                                aria-label="Previous day"
                                className="px-3 py-2 hover:bg-mist dark:hover:bg-white/5"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                            <span className="border-x border-border px-3 py-2 text-sm">
                                {formatDate(`${date}T12:00:00+08:00`, {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </span>
                            <Link
                                href={url(shift(date, 1), branch)}
                                aria-label="Next day"
                                className="px-3 py-2 hover:bg-mist dark:hover:bg-white/5"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="flex border border-border">
                            <button
                                type="button"
                                onClick={() =>
                                    (window.location.href = url(today, null))
                                }
                                className="h-10 px-3 text-sm hover:bg-mist dark:hover:bg-white/5"
                            >
                                Today
                            </button>
                            {branches.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                        (window.location.href = url(
                                            date,
                                            item.id,
                                        ))
                                    }
                                    className={
                                        item.id === branch
                                            ? 'h-10 bg-plum px-3 text-sm text-white'
                                            : 'h-10 px-3 text-sm hover:bg-mist dark:hover:bg-white/5'
                                    }
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                        <Link
                            href={pos.index().url}
                            className="press inline-flex h-10 items-center bg-plum px-4 text-sm font-medium text-white hover:bg-plum-deep"
                        >
                            Open the register
                        </Link>
                    </div>
                </header>

                <div className="grid gap-3 sm:grid-cols-4">
                    {stat('Sales', String(summary.count))}
                    {stat('Rung up', money(summary.total))}
                    {stat('Collected', money(summary.paid))}
                    {stat('Still due', money(summary.due))}
                </div>

                <div className="overflow-x-auto border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="px-4 py-3 font-normal">
                                    Reference
                                </th>
                                <th className="px-4 py-3 font-normal">
                                    Client
                                </th>
                                <th className="px-4 py-3 font-normal">
                                    Cashier
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Total
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Paid
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Due
                                </th>
                                <th className="px-4 py-3 font-normal">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr
                                    key={sale.id}
                                    className="border-b border-border last:border-0"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={pos.sales.show(sale.id).url}
                                            className="underline underline-offset-4 hover:text-plum"
                                        >
                                            {sale.reference}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">{sale.client}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {sale.cashier}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(sale.total)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(sale.amount_paid)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(sale.balance)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex border px-2 py-1 text-xs ${statusTone(sale.status)}`}
                                        >
                                            {statuses[sale.status] ??
                                                sale.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {sales.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        No sales on this day.
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
