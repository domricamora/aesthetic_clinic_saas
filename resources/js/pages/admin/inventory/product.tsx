import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, PackagePlus, SlidersHorizontal } from 'lucide-react';
import { formatDate, useCan } from '@/lib/admin';
import type { Labels } from '@/lib/admin';
import type { Batch, Movement } from '@/lib/inventory';
import { movementTone, signed } from '@/lib/inventory';
import { money } from '@/lib/pos';
import { cn } from '@/lib/utils';
import inventory from '@/routes/admin/inventory';

type Props = {
    product: {
        id: number;
        name: string;
        sku: string | null;
        category: string;
        price: number;
        cost: number;
        description: string | null;
        is_active: boolean;
    };
    branch: { id: number; name: string };
    branches: { id: number; name: string }[];
    on_hand: number;
    reorder_level: number;
    batches: Batch[];
    movements: Movement[];
    movement_types: Labels;
};

export default function InventoryProduct({
    product,
    branch,
    branches,
    on_hand,
    reorder_level,
    batches,
    movements,
}: Props) {
    const can = useCan();

    return (
        <>
            <Head title={product.name} />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Link
                            href={
                                inventory.index({
                                    query: { branch: branch.id },
                                }).url
                            }
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Inventory
                        </Link>
                        <h1 className="mt-2 font-display text-3xl md:text-4xl">
                            {product.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {product.sku ?? 'No SKU'} · {product.category} ·
                            sells for {money(product.price)}, costs{' '}
                            {money(product.cost)}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {can('inventory.create') && (
                            <>
                                <Link
                                    href={
                                        inventory.receive({
                                            query: {
                                                branch: branch.id,
                                                product: product.id,
                                            },
                                        }).url
                                    }
                                    className="press inline-flex h-10 items-center gap-2 bg-plum px-4 text-sm font-medium text-white hover:bg-plum-deep"
                                >
                                    <PackagePlus className="h-4 w-4" />
                                    Receive
                                </Link>
                                <Link
                                    href={
                                        inventory.adjust({
                                            query: {
                                                branch: branch.id,
                                                product: product.id,
                                            },
                                        }).url
                                    }
                                    className="press inline-flex h-10 items-center gap-2 border border-border bg-background px-4 text-sm hover:bg-mist dark:hover:bg-white/5"
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Adjust
                                </Link>
                            </>
                        )}
                        <div className="border border-border bg-background px-4 py-2 text-sm">
                            <span className="text-muted-foreground">
                                On hand at {branch.name}
                            </span>
                            <span className="mx-2 font-display text-xl tabular-nums">
                                {on_hand}
                            </span>
                            <span className="text-muted-foreground">
                                reorder at {reorder_level}
                            </span>
                        </div>
                        <div className="flex border border-border">
                            {branches.map((item) => (
                                <Link
                                    key={item.id}
                                    href={
                                        inventory.product(product.id, {
                                            query: { branch: item.id },
                                        }).url
                                    }
                                    className={cn(
                                        'h-10 px-3 text-sm',
                                        item.id === branch.id
                                            ? 'bg-plum text-white'
                                            : 'hover:bg-mist dark:hover:bg-white/5',
                                    )}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </header>

                {product.description && (
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        {product.description}
                    </p>
                )}

                <section>
                    <h2 className="font-display text-xl">Lots</h2>
                    <p className="text-sm text-muted-foreground">
                        Soonest expiry first. This is the order stock is used up
                        in.
                    </p>
                    <div className="mt-3 overflow-x-auto border border-border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-normal">
                                        Lot
                                    </th>
                                    <th className="px-4 py-3 font-normal">
                                        Received
                                    </th>
                                    <th className="px-4 py-3 font-normal">
                                        Expires
                                    </th>
                                    <th className="px-4 py-3 text-right font-normal">
                                        Units
                                    </th>
                                    <th className="px-4 py-3 text-right font-normal">
                                        Cost each
                                    </th>
                                    <th className="px-4 py-3 font-normal">
                                        Supplier
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map((batch) => (
                                    <tr
                                        key={batch.id}
                                        className="border-b border-border last:border-0"
                                    >
                                        <td className="px-4 py-3">
                                            {batch.lot_number ?? (
                                                <span className="text-muted-foreground">
                                                    No lot number
                                                </span>
                                            )}
                                            {batch.expired && (
                                                <span className="ml-2 border border-destructive/40 px-1.5 py-0.5 text-xs text-destructive">
                                                    Expired
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {formatDate(
                                                `${batch.received_on}T12:00:00+08:00`,
                                            )}
                                        </td>
                                        <td
                                            className={cn(
                                                'px-4 py-3 tabular-nums',
                                                batch.expired &&
                                                    'text-destructive',
                                                !batch.expired &&
                                                    batch.days_to_expiry !==
                                                        null &&
                                                    batch.days_to_expiry <=
                                                        30 &&
                                                    'text-gold-deep',
                                            )}
                                        >
                                            {batch.expires_on
                                                ? `${formatDate(
                                                      `${batch.expires_on}T12:00:00+08:00`,
                                                  )} · ${batch.days_to_expiry} d`
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-display text-base tabular-nums">
                                            {batch.quantity}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {money(batch.cost)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {batch.supplier ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                                {batches.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            This branch holds no lots of this
                                            product yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="font-display text-xl">Movement</h2>
                    <ul className="mt-3 flex flex-col divide-y divide-border border border-border">
                        {movements.map((movement) => (
                            <li
                                key={movement.id}
                                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm"
                            >
                                <span
                                    className={`w-14 text-right tabular-nums ${movementTone(movement.quantity)}`}
                                >
                                    {signed(movement.quantity)}
                                </span>
                                <span>{movement.type_label}</span>
                                {movement.lot && (
                                    <span className="text-muted-foreground">
                                        lot {movement.lot}
                                    </span>
                                )}
                                {movement.reference && (
                                    <span className="text-muted-foreground">
                                        {movement.reference}
                                    </span>
                                )}
                                {movement.note && (
                                    <span className="text-muted-foreground">
                                        {movement.note}
                                    </span>
                                )}
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {formatDate(movement.when, {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    })}
                                    {movement.by && ` · ${movement.by}`}
                                </span>
                            </li>
                        ))}
                        {movements.length === 0 && (
                            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                                Nothing has moved yet.
                            </li>
                        )}
                    </ul>
                </section>
            </div>
        </>
    );
}
