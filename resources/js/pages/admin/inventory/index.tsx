import { Head, Link, router } from '@inertiajs/react';
import {
    Package,
    PackagePlus,
    Search,
    SlidersHorizontal,
    Warehouse,
} from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useCan } from '@/lib/admin';
import { formatDate } from '@/lib/admin';
import type { Labels } from '@/lib/admin';
import type { Movement, StockRow } from '@/lib/inventory';
import {
    STATUS_LABELS,
    movementTone,
    signed,
    stockTone,
} from '@/lib/inventory';
import { money } from '@/lib/pos';
import { cn } from '@/lib/utils';
import catalog from '@/routes/admin/catalog';
import inventory from '@/routes/admin/inventory';

type Props = {
    branch: { id: number; name: string };
    branches: { id: number; name: string }[];
    categories: string[];
    query: string;
    category: string;
    alert: string | null;
    rows: StockRow[];
    alerts: { expired: number; expiring: number; low: number; out: number };
    total_value: number;
    movements: Movement[];
    movement_types: Labels;
};

export default function InventoryIndex({
    branch,
    branches,
    categories,
    query,
    category,
    alert,
    rows,
    alerts,
    total_value,
    movements,
}: Props) {
    const can = useCan();
    const [search, setSearch] = useState(query);

    const url = (extra: Record<string, string | number | undefined>) =>
        inventory.index({
            query: {
                branch: branch.id,
                q: search || undefined,
                category: category || undefined,
                alert: alert ?? undefined,
                ...extra,
            },
        }).url;

    const alertCard = (
        key: string,
        label: string,
        count: number,
        tone: string,
    ) => (
        <button
            key={key}
            type="button"
            onClick={() =>
                router.get(
                    url({
                        alert: alert === key ? undefined : key,
                    }),
                    { preserveScroll: true },
                )
            }
            className={`border px-4 py-3 text-left transition-colors duration-150 ease-out ${
                alert === key
                    ? 'border-plum'
                    : 'border-border hover:bg-mist dark:hover:bg-white/5'
            }`}
        >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`font-display text-2xl tabular-nums ${tone}`}>
                {count}
            </p>
        </button>
    );

    return (
        <>
            <Head title="Inventory" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {rows.length} of the catalogue at {branch.name}
                        </p>
                        <h1 className="mt-1 font-display text-3xl md:text-4xl">
                            Inventory
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex border border-border">
                            {branches.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                        router.get(
                                            inventory.index({
                                                query: { branch: item.id },
                                            }).url,
                                            { preserveScroll: true },
                                        )
                                    }
                                    className={
                                        item.id === branch.id
                                            ? 'h-10 bg-plum px-3 text-sm text-white'
                                            : 'h-10 px-3 text-sm hover:bg-mist dark:hover:bg-white/5'
                                    }
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                        {can('inventory.create') && (
                            <>
                                <Link
                                    href={
                                        inventory.adjust({
                                            query: { branch: branch.id },
                                        }).url
                                    }
                                    className="press inline-flex h-10 items-center gap-2 border border-border bg-background px-4 text-sm hover:bg-mist dark:hover:bg-white/5"
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Adjust
                                </Link>
                                <Link
                                    href={
                                        inventory.receive({
                                            query: { branch: branch.id },
                                        }).url
                                    }
                                    className="press inline-flex h-10 items-center gap-2 bg-plum px-4 text-sm font-medium text-white hover:bg-plum-deep"
                                >
                                    <PackagePlus className="h-4 w-4" />
                                    Receive stock
                                </Link>
                            </>
                        )}
                        <Link
                            href={catalog.index().url}
                            className="press inline-flex h-10 items-center gap-2 border border-border bg-background px-4 text-sm hover:bg-mist dark:hover:bg-white/5"
                        >
                            <Package className="h-4 w-4" />
                            Catalogue
                        </Link>
                    </div>
                </header>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {alertCard(
                        'expired',
                        'Expired',
                        alerts.expired,
                        alerts.expired ? 'text-destructive' : '',
                    )}
                    {alertCard(
                        'expiring',
                        'Expiring in 60 days',
                        alerts.expiring,
                        alerts.expiring ? 'text-gold-deep' : '',
                    )}
                    {alertCard(
                        'low',
                        'Low stock',
                        alerts.low,
                        alerts.low ? 'text-gold-deep' : '',
                    )}
                    {alertCard(
                        'out',
                        'Out of stock',
                        alerts.out,
                        alerts.out ? 'text-destructive' : '',
                    )}
                    <div className="border border-border bg-background px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                            Value at cost
                        </p>
                        <p className="font-display text-2xl tabular-nums">
                            {money(total_value)}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            router.get(url({}), { preserveScroll: true });
                        }}
                        className="relative flex-1"
                    >
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search the catalogue"
                            aria-label="Search the catalogue"
                            className="h-10 pl-9"
                        />
                    </form>
                    <select
                        value={category}
                        onChange={(event) =>
                            router.get(
                                url({
                                    category: event.target.value || undefined,
                                }),
                                { preserveScroll: true },
                            )
                        }
                        aria-label="Category"
                        className="h-10 border border-border bg-background px-3 text-sm"
                    >
                        <option value="">All categories</option>
                        {categories.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                    {alert && (
                        <button
                            type="button"
                            onClick={() =>
                                router.get(url({ alert: undefined }), {
                                    preserveScroll: true,
                                })
                            }
                            className="h-10 border border-border bg-background px-3 text-sm hover:bg-mist dark:hover:bg-white/5"
                        >
                            Clear filter
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="px-4 py-3 font-normal">
                                    Product
                                </th>
                                <th className="px-4 py-3 font-normal">
                                    Category
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    On hand
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Reorder at
                                </th>
                                <th className="px-4 py-3 font-normal">
                                    Next expiry
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Value
                                </th>
                                <th className="px-4 py-3 font-normal">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-border last:border-0"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={
                                                inventory.product(row.id, {
                                                    query: {
                                                        branch: branch.id,
                                                    },
                                                }).url
                                            }
                                            className="underline underline-offset-4 hover:text-plum"
                                        >
                                            {row.name}
                                        </Link>
                                        <span className="block text-xs text-muted-foreground">
                                            {row.sku ?? 'No SKU'}
                                            {row.lots > 0 &&
                                                ` · ${row.lots} ${row.lots === 1 ? 'lot' : 'lots'}`}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {row.category}
                                    </td>
                                    <td className="px-4 py-3 text-right font-display text-base tabular-nums">
                                        {row.on_hand}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                        {row.reorder_level}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">
                                        {row.next_expiry ? (
                                            <span
                                                className={cn(
                                                    row.next_expiry_days ===
                                                        null
                                                        ? ''
                                                        : row.next_expiry_days <
                                                            0
                                                          ? 'text-destructive'
                                                          : row.next_expiry_days <=
                                                              30
                                                            ? 'text-gold-deep'
                                                            : '',
                                                )}
                                            >
                                                {formatDate(
                                                    `${row.next_expiry}T12:00:00+08:00`,
                                                )}
                                                {row.next_expiry_days !==
                                                    null &&
                                                    ` · ${
                                                        row.next_expiry_days < 0
                                                            ? `${Math.abs(row.next_expiry_days)} d ago`
                                                            : `${row.next_expiry_days} d`
                                                    }`}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(row.value)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex border px-2 py-1 text-xs ${stockTone(row.status)}`}
                                        >
                                            {STATUS_LABELS[row.status] ??
                                                row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        Nothing matches these filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <section>
                    <h2 className="flex items-center gap-2 font-display text-xl">
                        <Warehouse className="h-4 w-4" />
                        Recent movement
                    </h2>
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
                                <span className="font-medium">
                                    {movement.product}
                                </span>
                                <span className="text-muted-foreground">
                                    {movement.type_label}
                                </span>
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
