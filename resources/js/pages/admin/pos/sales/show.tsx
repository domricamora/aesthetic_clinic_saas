import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, useCan } from '@/lib/admin';
import type { Labels } from '@/lib/admin';
import type { SaleDetail } from '@/lib/pos';
import { money, statusTone } from '@/lib/pos';
import pos from '@/routes/admin/pos';

type Props = {
    sale: SaleDetail;
    methods: Labels;
    statuses: Labels;
};

const row = (
    label: string,
    value: string,
    strong = false,
): React.JSX.Element => (
    <div className="flex items-center justify-between gap-4">
        <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
        <span
            className={
                strong ? 'font-display text-lg tabular-nums' : 'tabular-nums'
            }
        >
            {value}
        </span>
    </div>
);

export default function PosSaleShow({ sale, methods, statuses }: Props) {
    const can = useCan();
    const { clinic } = usePage().props;
    const refund = useForm({
        amount: sale.balance > 0 ? sale.balance.toFixed(2) : '',
        method: 'cash',
        reason: '',
    });

    return (
        <>
            <Head title={`Receipt ${sale.reference}`} />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4 print:hidden">
                    <div>
                        <Link
                            href={pos.sales.index().url}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            All sales
                        </Link>
                        <h1 className="mt-2 font-display text-3xl md:text-4xl">
                            {sale.reference}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`inline-flex border px-3 py-1 text-sm ${statusTone(sale.status)}`}
                        >
                            {statuses[sale.status] ?? sale.status}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.print()}
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <article className="border border-border bg-background p-6 print:border-0">
                        <header className="border-b border-border pb-4 text-center">
                            <h2 className="font-display text-2xl">
                                {clinic.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {clinic.contact.address}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {clinic.contact.phone} &middot;{' '}
                                {clinic.contact.email}
                            </p>
                        </header>

                        <dl className="grid gap-2 border-b border-border py-4 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="text-muted-foreground">
                                    Reference
                                </dt>
                                <dd>{sale.reference}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Date</dt>
                                <dd>
                                    {formatDate(sale.created_at, {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    })}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">
                                    Client
                                </dt>
                                <dd>
                                    {sale.client}
                                    {sale.client_phone && (
                                        <span className="block text-muted-foreground">
                                            {sale.client_phone}
                                        </span>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">
                                    Cashier
                                </dt>
                                <dd>
                                    {sale.cashier} &middot; {sale.branch}
                                </dd>
                            </div>
                        </dl>

                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-muted-foreground">
                                    <th className="py-2 font-normal">Item</th>
                                    <th className="py-2 text-right font-normal">
                                        Qty
                                    </th>
                                    <th className="py-2 text-right font-normal">
                                        Price
                                    </th>
                                    <th className="py-2 text-right font-normal">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.map((item, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-border/60"
                                    >
                                        <td className="py-2">
                                            {item.description}
                                            <span className="block text-xs text-muted-foreground">
                                                {item.kind === 'service'
                                                    ? 'Service'
                                                    : 'Product'}
                                            </span>
                                        </td>
                                        <td className="py-2 text-right tabular-nums">
                                            {item.quantity}
                                        </td>
                                        <td className="py-2 text-right tabular-nums">
                                            {money(item.unit_price)}
                                        </td>
                                        <td className="py-2 text-right tabular-nums">
                                            {money(item.line_total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-4 flex flex-col gap-1">
                            {row('Subtotal', money(sale.subtotal))}
                            {sale.discount_amount > 0 &&
                                row(
                                    `Discount${
                                        sale.discount_type === 'percent'
                                            ? ` (${sale.discount_value}%)`
                                            : ''
                                    }`,
                                    `- ${money(sale.discount_amount)}`,
                                )}
                            {row('Total', money(sale.total), true)}
                            {row('Paid', money(sale.amount_paid))}
                            {sale.balance > 0 &&
                                row('Balance due', money(sale.balance))}
                        </div>

                        <div className="mt-4 border-t border-border pt-4">
                            <h3 className="text-sm text-muted-foreground">
                                Payments
                            </h3>
                            <ul className="mt-2 flex flex-col gap-1 text-sm">
                                {sale.payments.map((payment) => (
                                    <li
                                        key={payment.id}
                                        className="flex items-center justify-between gap-4"
                                    >
                                        <span>
                                            {payment.method_label}
                                            {payment.type === 'refund' && (
                                                <span className="text-destructive">
                                                    {' '}
                                                    refund
                                                </span>
                                            )}
                                            <span className="block text-xs text-muted-foreground">
                                                {formatDate(payment.paid_at, {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short',
                                                })}
                                                {payment.reference &&
                                                    ` · ref ${payment.reference}`}
                                                {payment.note &&
                                                    ` · ${payment.note}`}
                                            </span>
                                        </span>
                                        <span className="tabular-nums">
                                            {money(payment.amount)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {sale.note && (
                            <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                                {sale.note}
                            </p>
                        )}

                        <p className="mt-6 text-center text-xs text-muted-foreground">
                            Thank you. Products and aftercare are dispensed at
                            the counter. Ask the front desk about a membership
                            if you visit often.
                        </p>
                    </article>

                    {can('pos.refund') && (
                        <aside className="flex h-fit flex-col gap-3 border border-border bg-background p-4 print:hidden">
                            <h2 className="font-display text-lg">Refund</h2>
                            <p className="text-sm text-muted-foreground">
                                Returns stock and records the money against the
                                sale. It can never be more than what was taken.
                            </p>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    refund.post(pos.sales.refund(sale.id).url);
                                }}
                                className="flex flex-col gap-3"
                            >
                                <div className="grid gap-1">
                                    <Label htmlFor="refund-amount">
                                        Amount
                                    </Label>
                                    <Input
                                        id="refund-amount"
                                        type="number"
                                        min={0.01}
                                        step="0.01"
                                        value={refund.data.amount}
                                        onChange={(event) =>
                                            refund.setData(
                                                'amount',
                                                event.target.value,
                                            )
                                        }
                                        disabled={sale.amount_paid <= 0}
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Method</Label>
                                    <Select
                                        value={refund.data.method}
                                        onValueChange={(value) =>
                                            refund.setData('method', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(methods).map(
                                                ([key, label]) => (
                                                    <SelectItem
                                                        key={key}
                                                        value={key}
                                                    >
                                                        {label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="refund-reason">
                                        Reason
                                    </Label>
                                    <Input
                                        id="refund-reason"
                                        value={refund.data.reason}
                                        onChange={(event) =>
                                            refund.setData(
                                                'reason',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Why is this being returned?"
                                    />
                                    {refund.errors.reason && (
                                        <p className="text-sm text-destructive">
                                            {refund.errors.reason}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={
                                        refund.processing ||
                                        sale.amount_paid <= 0
                                    }
                                >
                                    {refund.processing && <Spinner />}
                                    Record refund
                                </Button>
                            </form>
                        </aside>
                    )}
                </div>
            </div>
        </>
    );
}
