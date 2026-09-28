import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { Labels } from '@/lib/admin';
import { money } from '@/lib/pos';
import { cn } from '@/lib/utils';
import accounting from '@/routes/admin/accounting';

type Props = {
    accounts: {
        id: number;
        code: string;
        name: string;
        type: string;
        normal_balance: string;
        balance: number;
        is_system: boolean;
        is_active: boolean;
    }[];
    types: Labels;
};

export default function AccountingAccounts({ accounts, types }: Props) {
    const groups = Object.keys(types);

    return (
        <>
            <Head title="Chart of accounts" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header>
                    <Link
                        href={accounting.index().url}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Accounting
                    </Link>
                    <h1 className="mt-2 font-display text-3xl md:text-4xl">
                        Chart of accounts
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        What every peso is filed under. The counter, payroll and
                        this page all post against these codes.
                    </p>
                </header>

                {groups.map((group) => {
                    const rows = accounts.filter((a) => a.type === group);
                    if (rows.length === 0) return null;
                    return (
                        <section key={group}>
                            <h2 className="font-display text-xl">
                                {types[group]}
                            </h2>
                            <div className="mt-3 overflow-x-auto border border-border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-left text-muted-foreground">
                                            <th className="px-4 py-3 font-normal">
                                                Code
                                            </th>
                                            <th className="px-4 py-3 font-normal">
                                                Account
                                            </th>
                                            <th className="px-4 py-3 font-normal">
                                                Normal side
                                            </th>
                                            <th className="px-4 py-3 text-right font-normal">
                                                Balance
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((account) => (
                                            <tr
                                                key={account.id}
                                                className="border-b border-border last:border-0"
                                            >
                                                <td className="px-4 py-3 text-muted-foreground tabular-nums">
                                                    {account.code}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {account.name}
                                                    {!account.is_active && (
                                                        <span className="ml-2 border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                                                            inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {account.normal_balance}
                                                </td>
                                                <td
                                                    className={cn(
                                                        'px-4 py-3 text-right tabular-nums',
                                                        account.balance < 0 &&
                                                            'text-destructive',
                                                    )}
                                                >
                                                    {money(
                                                        Math.abs(
                                                            account.balance,
                                                        ),
                                                    )}
                                                    {account.balance < 0 && (
                                                        <span className="ml-1 text-xs text-muted-foreground">
                                                            cr
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    );
                })}
            </div>
        </>
    );
}
