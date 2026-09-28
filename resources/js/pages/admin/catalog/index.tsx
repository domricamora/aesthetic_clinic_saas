import { Head, Link, router, useForm } from '@inertiajs/react';
import { Check, Package, Pencil, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useCan } from '@/lib/admin';
import { money } from '@/lib/pos';
import { cn } from '@/lib/utils';
import catalog from '@/routes/admin/catalog';
import { ServiceCatalogue } from './services';
import inventory from '@/routes/admin/inventory';

type Row = {
    id: number;
    name: string;
    sku: string | null;
    category: string | null;
    description: string | null;
    price: number;
    cost: number;
    is_active: boolean;
    on_hand: number;
    margin: number | null;
};

type Props = {
    tab: string;
    products: Row[];
    services: import('./services').ServiceRow[];
    service_categories: { id: number; name: string }[];
    categories: string[];
    query: string;
    category: string;
    status: string;
    branch: { id: number; name: string };
    branches: { id: number; name: string }[];
    active: number;
    out_of_stock: number;
};

/** What the clinic sells: the things on the shelves, and the things on the menu. */
function CatalogueTabs({ tab }: { tab: string }) {
    const tabs = [
        { key: 'products', label: 'Products' },
        { key: 'services', label: 'Services' },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
                <Link
                    key={item.key}
                    href={catalog.index({ query: { tab: item.key } }).url}
                    preserveScroll
                    className={cn(
                        'press h-10 border px-4 text-sm',
                        tab === item.key
                            ? 'border-plum bg-lilac/60 text-plum'
                            : 'border-border bg-background hover:bg-mist dark:hover:bg-white/5',
                    )}
                >
                    {item.label}
                </Link>
            ))}
        </div>
    );
}

const empty = {
    name: '',
    sku: '',
    category: '',
    description: '',
    price: '',
    cost: '',
    is_active: 1,
};

export default function CatalogIndex(props: Props) {
    const can = useCan();
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<number | null>(null);
    const [search, setSearch] = useState(props.query);

    const create = useForm({ ...empty });
    const update = useForm({ ...empty });

    const url = (extra: Record<string, string | number | undefined>) =>
        catalog.index({
            query: {
                q: search || undefined,
                category: props.category || undefined,
                status: props.status === 'all' ? undefined : props.status,
                branch: props.branch.id,
                ...extra,
            },
        }).url;

    const startEdit = (row: Row) => {
        setEditing(row.id);
        update.setData({
            name: row.name,
            sku: row.sku ?? '',
            category: row.category ?? '',
            description: row.description ?? '',
            price: String(row.price),
            cost: String(row.cost),
            is_active: row.is_active ? 1 : 0,
        });
    };

    const stat = (label: string, value: string, note?: string) => (
        <div className="border border-border bg-background px-4 py-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-2xl tabular-nums">{value}</p>
            {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
    );

    return (
        <>
            <Head title="Catalogue" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {props.branch.name}
                        </p>
                        <h1 className="mt-1 font-display text-3xl md:text-4xl">
                            Catalogue
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            What the counter sells. A price changed here is what
                            the register charges from its next load, and
                            receipts already printed keep the price they were
                            sold at.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={inventory.index().url}
                            className="press inline-flex h-10 items-center gap-2 border border-border bg-background px-4 text-sm hover:bg-mist dark:hover:bg-white/5"
                        >
                            <Package className="h-4 w-4" />
                            Stock
                        </Link>
                        {can('inventory.create') && (
                            <Button
                                type="button"
                                onClick={() => setAdding((v) => !v)}
                                className="h-10 bg-plum text-white hover:bg-plum-deep"
                            >
                                {adding ? (
                                    <X className="h-4 w-4" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                {adding ? 'Cancel' : 'Add item'}
                            </Button>
                        )}
                    </div>
                </header>

                <div className="grid gap-3 sm:grid-cols-3">
                    {stat('Items', String(props.products.length))}
                    {stat(
                        'On sale',
                        String(props.active),
                        'shown at the register',
                    )}
                    {stat(
                        'Out of stock',
                        String(props.out_of_stock),
                        'sellable but nothing on the shelf',
                    )}
                </div>

                <CatalogueTabs tab={props.tab} />

                {props.tab === 'services' ? (
                    <ServiceCatalogue
                        services={props.services}
                        categories={props.service_categories}
                        canEdit={can('inventory.create')}
                    />
                ) : (
                    <>
                        {adding && (
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    create.post(catalog.store().url, {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            create.reset();
                                            setAdding(false);
                                        },
                                    });
                                }}
                                className="grid max-w-4xl gap-4 border border-border bg-background p-6 sm:grid-cols-3"
                            >
                                <div className="grid gap-1 sm:col-span-2">
                                    <Label htmlFor="new-name">Name</Label>
                                    <Input
                                        id="new-name"
                                        value={create.data.name}
                                        onChange={(e) =>
                                            create.setData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Vitamin C Serum 30ml"
                                        required
                                    />
                                    {create.errors.name && (
                                        <p className="text-sm text-destructive">
                                            {create.errors.name}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="new-sku">SKU</Label>
                                    <Input
                                        id="new-sku"
                                        value={create.data.sku}
                                        onChange={(e) =>
                                            create.setData(
                                                'sku',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {create.errors.sku && (
                                        <p className="text-sm text-destructive">
                                            {create.errors.sku}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="new-category">
                                        Category
                                    </Label>
                                    <Input
                                        id="new-category"
                                        value={create.data.category}
                                        onChange={(e) =>
                                            create.setData(
                                                'category',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Serum"
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="new-price">Price</Label>
                                    <Input
                                        id="new-price"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={create.data.price}
                                        onChange={(e) =>
                                            create.setData(
                                                'price',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {create.errors.price && (
                                        <p className="text-sm text-destructive">
                                            {create.errors.price}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="new-cost">Cost</Label>
                                    <Input
                                        id="new-cost"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={create.data.cost}
                                        onChange={(e) =>
                                            create.setData(
                                                'cost',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {create.errors.cost && (
                                        <p className="text-sm text-destructive">
                                            {create.errors.cost}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-1 sm:col-span-3">
                                    <Label htmlFor="new-description">
                                        Description
                                    </Label>
                                    <Input
                                        id="new-description"
                                        value={create.data.description}
                                        onChange={(e) =>
                                            create.setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground sm:col-span-3">
                                    It goes on sale straight away, but there is
                                    nothing on the shelf until you receive
                                    stock.
                                </p>
                                <div className="flex gap-2 sm:col-span-3">
                                    <Button
                                        type="submit"
                                        disabled={create.processing}
                                        className="h-10 bg-plum text-white hover:bg-plum-deep"
                                    >
                                        {create.processing && <Spinner />}
                                        Add item
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setAdding(false)}
                                        className="h-10"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    router.get(url({}), {
                                        preserveScroll: true,
                                    });
                                }}
                                className="relative flex-1"
                            >
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name or SKU"
                                    aria-label="Search by name or SKU"
                                    className="h-10 pl-9"
                                />
                            </form>
                            <select
                                value={props.category}
                                onChange={(e) =>
                                    router.get(
                                        url({
                                            category:
                                                e.target.value || undefined,
                                        }),
                                        { preserveScroll: true },
                                    )
                                }
                                aria-label="Category"
                                className="h-10 border border-border bg-background px-3 text-sm"
                            >
                                <option value="">All categories</option>
                                {props.categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={props.status}
                                onChange={(e) =>
                                    router.get(
                                        url({ status: e.target.value }),
                                        {
                                            preserveScroll: true,
                                        },
                                    )
                                }
                                aria-label="Status"
                                className="h-10 border border-border bg-background px-3 text-sm"
                            >
                                <option value="all">All items</option>
                                <option value="active">On sale</option>
                                <option value="inactive">Hidden</option>
                            </select>
                            <select
                                value={props.branch.id}
                                onChange={(e) =>
                                    router.get(
                                        url({ branch: Number(e.target.value) }),
                                        { preserveScroll: true },
                                    )
                                }
                                aria-label="Branch"
                                className="h-10 border border-border bg-background px-3 text-sm"
                            >
                                {props.branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="overflow-x-auto border border-border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left text-muted-foreground">
                                        <th className="px-4 py-3 font-normal">
                                            Item
                                        </th>
                                        <th className="px-4 py-3 text-right font-normal">
                                            Price
                                        </th>
                                        <th className="px-4 py-3 text-right font-normal">
                                            Cost
                                        </th>
                                        <th className="px-4 py-3 text-right font-normal">
                                            Margin
                                        </th>
                                        <th className="px-4 py-3 text-right font-normal">
                                            On hand
                                        </th>
                                        <th className="px-4 py-3 font-normal">
                                            Status
                                        </th>
                                        {can('inventory.create') && (
                                            <th className="px-4 py-3 font-normal" />
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {props.products.map((row) =>
                                        editing === row.id ? (
                                            <tr
                                                key={row.id}
                                                className="border-b border-border bg-lilac/20"
                                            >
                                                <td
                                                    className="px-4 py-3"
                                                    colSpan={2}
                                                >
                                                    <div className="grid gap-2">
                                                        <Input
                                                            aria-label="Name"
                                                            value={
                                                                update.data.name
                                                            }
                                                            onChange={(e) =>
                                                                update.setData(
                                                                    'name',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <Input
                                                            aria-label="SKU"
                                                            placeholder="SKU"
                                                            value={
                                                                update.data.sku
                                                            }
                                                            onChange={(e) =>
                                                                update.setData(
                                                                    'sku',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        aria-label="Price"
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={
                                                            update.data.price
                                                        }
                                                        onChange={(e) =>
                                                            update.setData(
                                                                'price',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                    {update.errors.price && (
                                                        <p className="text-xs text-destructive">
                                                            {
                                                                update.errors
                                                                    .price
                                                            }
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        aria-label="Cost"
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={update.data.cost}
                                                        onChange={(e) =>
                                                            update.setData(
                                                                'cost',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td
                                                    className="px-4 py-3"
                                                    colSpan={2}
                                                >
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                update.data
                                                                    .is_active ===
                                                                1
                                                            }
                                                            onChange={(e) =>
                                                                update.setData(
                                                                    'is_active',
                                                                    e.target
                                                                        .checked
                                                                        ? 1
                                                                        : 0,
                                                                )
                                                            }
                                                        />
                                                        On sale
                                                    </label>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            disabled={
                                                                update.processing
                                                            }
                                                            onClick={() =>
                                                                update.patch(
                                                                    catalog.update(
                                                                        row.id,
                                                                    ).url,
                                                                    {
                                                                        preserveScroll: true,
                                                                        onSuccess:
                                                                            () =>
                                                                                setEditing(
                                                                                    null,
                                                                                ),
                                                                    },
                                                                )
                                                            }
                                                            className="bg-plum text-white hover:bg-plum-deep"
                                                        >
                                                            {update.processing ? (
                                                                <Spinner />
                                                            ) : (
                                                                <Check className="h-3 w-3" />
                                                            )}
                                                            Save
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setEditing(null)
                                                            }
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr
                                                key={row.id}
                                                className="border-b border-border last:border-0"
                                            >
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={
                                                            inventory.product(
                                                                row.id,
                                                            ).url
                                                        }
                                                        className="underline underline-offset-4 hover:text-plum"
                                                    >
                                                        {row.name}
                                                    </Link>
                                                    <span className="block text-xs text-muted-foreground">
                                                        {row.sku ?? 'No SKU'}
                                                        {row.category
                                                            ? ` · ${row.category}`
                                                            : ''}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {money(row.price)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                                    {money(row.cost)}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {row.margin === null ? (
                                                        '—'
                                                    ) : (
                                                        <span
                                                            className={cn(
                                                                row.margin <
                                                                    0 &&
                                                                    'text-destructive',
                                                            )}
                                                        >
                                                            {row.margin}%
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {row.on_hand > 0 ? (
                                                        row.on_hand
                                                    ) : (
                                                        <span className="text-gold-deep">
                                                            none
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={cn(
                                                            'inline-flex border px-2 py-1 text-xs',
                                                            row.is_active
                                                                ? 'border-plum/30 bg-lilac/60 text-plum'
                                                                : 'border-border bg-background text-muted-foreground',
                                                        )}
                                                    >
                                                        {row.is_active
                                                            ? 'On sale'
                                                            : 'Hidden'}
                                                    </span>
                                                </td>
                                                {can('inventory.create') && (
                                                    <td className="px-4 py-3 text-right">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                startEdit(row)
                                                            }
                                                            aria-label={`Edit ${row.name}`}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        ),
                                    )}
                                    {props.products.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-10 text-center text-muted-foreground"
                                            >
                                                Nothing matches those filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
