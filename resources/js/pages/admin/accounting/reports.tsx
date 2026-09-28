import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { money } from '@/lib/pos';
import { cn } from '@/lib/utils';
import accounting from '@/routes/admin/accounting';

type Line = {
    code: string;
    name: string;
    type: string;
    period: number;
    year: number;
};

type Props = {
    from: string;
    to: string;
    trial_balance: Line[];
    trial_totals: { debit: number; credit: number };
    income_statement: {
        revenue: Line[];
        expenses: Line[];
        total_revenue: number;
        total_expenses: number;
        net: number;
    };
    balance_sheet: {
        assets: Line[];
        liabilities: Line[];
        equity: Line[];
        total_assets: number;
        total_liabilities: number;
        total_equity: number;
        retained: number;
        balances: boolean;
    };
};

const Tabs = ['Trial balance', 'Income', 'Balance sheet'] as const;

export default function AccountingReports(props: Props) {
    const [tab, setTab] = useState<(typeof Tabs)[number]>('Trial balance');
    const year = props.to.slice(0, 4);

    const go = (from: string, to: string) =>
        router.get(accounting.reports({ query: { from, to } }).url, {
            preserveScroll: true,
        });

    return (
        <>
            <Head title="Reports" />
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
                            Reports
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {props.from} – {props.to} · year to date from 1 Jan{' '}
                            {year}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={props.from}
                            onChange={(e) => go(e.target.value, props.to)}
                            aria-label="From"
                            className="h-10"
                        />
                        <Input
                            type="date"
                            value={props.to}
                            onChange={(e) => go(props.from, e.target.value)}
                            aria-label="To"
                            className="h-10"
                        />
                    </div>
                </header>

                <div className="flex flex-wrap gap-2">
                    {Tabs.map((name) => (
                        <button
                            key={name}
                            type="button"
                            onClick={() => setTab(name)}
                            aria-pressed={tab === name}
                            className={cn(
                                'press h-10 border px-4 text-sm',
                                tab === name
                                    ? 'border-plum bg-lilac/60 text-plum'
                                    : 'border-border bg-background hover:bg-mist dark:hover:bg-white/5',
                            )}
                        >
                            {name}
                        </button>
                    ))}
                </div>

                {tab === 'Trial balance' && (
                    <div className="overflow-x-auto border border-border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-normal">
                                        Code
                                    </th>
                                    <th className="px-4 py-3 font-normal">
                                        Account
                                    </th>
                                    <th className="px-4 py-3 text-right font-normal">
                                        Debit
                                    </th>
                                    <th className="px-4 py-3 text-right font-normal">
                                        Credit
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {props.trial_balance.map((line) => (
                                    <tr
                                        key={line.code}
                                        className="border-b border-border last:border-0"
                                    >
                                        <td className="px-4 py-3 text-muted-foreground tabular-nums">
                                            {line.code}
                                        </td>
                                        <td className="px-4 py-3">
                                            {line.name}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {line.year > 0
                                                ? money(line.year)
                                                : ''}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {line.year < 0
                                                ? money(-line.year)
                                                : ''}
                                        </td>
                                    </tr>
                                ))}
                                {props.trial_balance.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            Nothing posted in this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-border font-medium">
                                    <td className="px-4 py-3" colSpan={2}>
                                        Totals
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(props.trial_totals.debit)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(props.trial_totals.credit)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {tab === 'Income' && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <section className="border border-border bg-background p-5">
                            <h2 className="font-display text-xl">Revenue</h2>
                            <ul className="mt-3 flex flex-col gap-2 text-sm">
                                {props.income_statement.revenue.map((line) => (
                                    <li
                                        key={line.code}
                                        className="flex justify-between gap-4"
                                    >
                                        <span>{line.name}</span>
                                        <span className="tabular-nums">
                                            {money(line.year)}
                                        </span>
                                    </li>
                                ))}
                                {props.income_statement.revenue.length ===
                                    0 && (
                                    <li className="text-muted-foreground">
                                        No revenue yet.
                                    </li>
                                )}
                            </ul>
                            <p className="mt-4 flex justify-between border-t border-border pt-2 text-sm font-medium">
                                <span>Total revenue</span>
                                <span className="tabular-nums">
                                    {money(
                                        props.income_statement.total_revenue,
                                    )}
                                </span>
                            </p>
                        </section>

                        <section className="border border-border bg-background p-5">
                            <h2 className="font-display text-xl">Expenses</h2>
                            <ul className="mt-3 flex flex-col gap-2 text-sm">
                                {props.income_statement.expenses.map((line) => (
                                    <li
                                        key={line.code}
                                        className="flex justify-between gap-4"
                                    >
                                        <span>{line.name}</span>
                                        <span className="tabular-nums">
                                            {money(line.year)}
                                        </span>
                                    </li>
                                ))}
                                {props.income_statement.expenses.length ===
                                    0 && (
                                    <li className="text-muted-foreground">
                                        No expenses yet.
                                    </li>
                                )}
                            </ul>
                            <p className="mt-4 flex justify-between border-t border-border pt-2 text-sm font-medium">
                                <span>Total expenses</span>
                                <span className="tabular-nums">
                                    {money(
                                        props.income_statement.total_expenses,
                                    )}
                                </span>
                            </p>
                        </section>

                        <section className="border border-2 border-border bg-background p-5 lg:col-span-2">
                            <p className="flex items-baseline justify-between">
                                <span className="font-display text-xl">
                                    Net{' '}
                                    {props.income_statement.net < 0
                                        ? 'loss'
                                        : 'income'}
                                </span>
                                <span className="font-display text-3xl tabular-nums">
                                    {money(props.income_statement.net)}
                                </span>
                            </p>
                        </section>
                    </div>
                )}

                {tab === 'Balance sheet' && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Section
                            title="Assets"
                            rows={props.balance_sheet.assets}
                            total={props.balance_sheet.total_assets}
                        />
                        <div className="flex flex-col gap-6">
                            <Section
                                title="Liabilities"
                                rows={props.balance_sheet.liabilities}
                                total={props.balance_sheet.total_liabilities}
                            />
                            <Section
                                title="Equity"
                                rows={props.balance_sheet.equity}
                                total={props.balance_sheet.total_equity}
                            />
                            <p className="flex justify-between text-sm">
                                <span>Retained for the year</span>
                                <span className="tabular-nums">
                                    {money(props.balance_sheet.retained)}
                                </span>
                            </p>
                        </div>

                        <section className="border border-2 border-border bg-background p-5 lg:col-span-2">
                            <p className="flex flex-wrap items-baseline justify-between gap-2">
                                <span className="font-display text-xl">
                                    {props.balance_sheet.balances
                                        ? 'The books balance'
                                        : 'These do not balance'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    assets{' '}
                                    {money(props.balance_sheet.total_assets)} ·
                                    liabilities and equity{' '}
                                    {money(
                                        props.balance_sheet.total_liabilities +
                                            props.balance_sheet.total_equity +
                                            props.balance_sheet.retained,
                                    )}
                                </span>
                            </p>
                            {!props.balance_sheet.balances && (
                                <p className="mt-2 text-sm text-destructive">
                                    Assets do not equal liabilities plus equity.
                                    Check the journal for a posting made outside
                                    this system.
                                </p>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </>
    );
}

const Section = ({
    title,
    rows,
    total,
}: {
    title: string;
    rows: Line[];
    total: number;
}) => (
    <section className="border border-border bg-background p-5">
        <h2 className="font-display text-xl">{title}</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
            {rows.map((line) => (
                <li key={line.code} className="flex justify-between gap-4">
                    <span>{line.name}</span>
                    <span className="tabular-nums">{money(line.year)}</span>
                </li>
            ))}
            {rows.length === 0 && (
                <li className="text-muted-foreground">Nothing here yet.</li>
            )}
        </ul>
        <p className="mt-4 flex justify-between border-t border-border pt-2 text-sm font-medium">
            <span>Total {title.toLowerCase()}</span>
            <span className="tabular-nums">{money(total)}</span>
        </p>
    </section>
);
