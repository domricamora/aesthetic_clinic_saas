import { Head, Link, router, usePage } from '@inertiajs/react';
import { Minus, Plus, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { CartLine, RegisterProps, Sellable } from '@/lib/pos';
import { cartTotals, money } from '@/lib/pos';
import { cn } from '@/lib/utils';
import pos from '@/routes/admin/pos';

const key = (item: Sellable) => `${item.kind}:${item.id}`;

export default function PosIndex({
    branch_id,
    branches,
    lead,
    services,
    products,
    promotions,
    methods,
    available_methods,
}: RegisterProps) {
    const errors = usePage().props.errors as Record<string, string>;
    const [lines, setLines] = useState<CartLine[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'service' | 'product'>('all');
    const [discountType, setDiscountType] = useState('none');
    const [discountValue, setDiscountValue] = useState('');
    const [method, setMethod] = useState(available_methods[0] ?? 'cash');
    const [tendered, setTendered] = useState('');
    const [clientName, setClientName] = useState(lead?.name ?? '');
    const [clientPhone, setClientPhone] = useState(lead?.phone ?? '');
    const [promotionId, setPromotionId] = useState('');
    const [busy, setBusy] = useState(false);

    const catalogue = useMemo(() => {
        const term = search.trim().toLowerCase();
        return [...services, ...products]
            .filter((item) => filter === 'all' || item.kind === filter)
            .filter(
                (item) => term === '' || item.name.toLowerCase().includes(term),
            );
    }, [services, products, search, filter]);

    const { subtotal, discount, total } = cartTotals(
        lines,
        discountType,
        Number(discountValue) || 0,
    );
    const tenderedAmount = Number(tendered) || 0;
    const change = Math.max(0, tenderedAmount - total);
    const due = total - Math.min(tenderedAmount, total);

    const add = (item: Sellable) => {
        setLines((current) => {
            const existing = current.find((line) => key(line) === key(item));
            if (existing) {
                return current.map((line) =>
                    line === existing
                        ? { ...line, quantity: line.quantity + 1 }
                        : line,
                );
            }
            return [...current, { ...item, quantity: 1 }];
        });
    };

    const changeQuantity = (line: CartLine, by: number) => {
        setLines((current) =>
            current
                .map((item) =>
                    item === line
                        ? { ...item, quantity: item.quantity + by }
                        : item,
                )
                .filter((item) => item.quantity > 0),
        );
    };

    const complete = () => {
        setBusy(true);
        router.post(
            pos.store().url,
            {
                branch_id,
                items: lines.map((line) => ({
                    kind: line.kind,
                    id: line.id,
                    quantity: line.quantity,
                })),
                discount_type: discountType,
                discount_value: Number(discountValue) || 0,
                method,
                amount: tenderedAmount > 0 ? tenderedAmount : total,
                client_name: clientName || null,
                client_phone: clientPhone || null,
                lead_id: lead?.id ?? null,
                promotion_id: promotionId || null,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setBusy(false);
                    setLines([]);
                    setTendered('');
                    setDiscountType('none');
                    setDiscountValue('');
                },
            },
        );
    };

    return (
        <>
            <Head title="Point of sale" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Ring up services and products
                        </p>
                        <h1 className="mt-1 font-display text-3xl md:text-4xl">
                            Counter
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex border border-border">
                            {branches.map((branch) => (
                                <button
                                    key={branch.id}
                                    type="button"
                                    onClick={() =>
                                        router.get(
                                            pos.index({
                                                query: { branch: branch.id },
                                            }).url,
                                            { preserveScroll: true },
                                        )
                                    }
                                    className={cn(
                                        'h-10 px-3 text-sm transition-colors duration-150 ease-out',
                                        branch.id === branch_id
                                            ? 'bg-plum text-white'
                                            : 'bg-background hover:bg-mist dark:hover:bg-white/5',
                                    )}
                                >
                                    {branch.name}
                                </button>
                            ))}
                        </div>
                        <Link
                            href={pos.sales.index().url}
                            className="press inline-flex h-10 items-center gap-2 border border-border bg-background px-4 text-sm hover:bg-mist dark:hover:bg-white/5"
                        >
                            <ShoppingBag className="h-4 w-4" />
                            Sales
                        </Link>
                    </div>
                </header>

                {errors.items && (
                    <p className="border border-destructive/40 bg-background px-4 py-3 text-sm text-destructive">
                        {errors.items}
                    </p>
                )}
                {errors.method && (
                    <p className="border border-destructive/40 bg-background px-4 py-3 text-sm text-destructive">
                        {errors.method}
                    </p>
                )}

                <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                    <section className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search the catalogue"
                                    className="h-10 pl-9"
                                    aria-label="Search the catalogue"
                                />
                            </div>
                            {(['all', 'service', 'product'] as const).map(
                                (key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setFilter(key)}
                                        className={cn(
                                            'h-10 border px-3 text-sm capitalize transition-colors duration-150 ease-out',
                                            filter === key
                                                ? 'border-plum bg-plum text-white'
                                                : 'border-border bg-background hover:bg-mist dark:hover:bg-white/5',
                                        )}
                                    >
                                        {key === 'all'
                                            ? 'All'
                                            : key === 'service'
                                              ? 'Services'
                                              : 'Products'}
                                    </button>
                                ),
                            )}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {catalogue.map((item) => {
                                const out =
                                    item.kind === 'product' &&
                                    (item.stock ?? 0) <= 0;
                                return (
                                    <button
                                        key={key(item)}
                                        type="button"
                                        disabled={out}
                                        onClick={() => add(item)}
                                        className={cn(
                                            'press flex flex-col items-start gap-1 border border-border bg-background p-3 text-left transition-colors duration-150 ease-out hover:border-plum/40 hover:bg-mist disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5',
                                            out && 'hover:border-border',
                                        )}
                                    >
                                        <span className="text-sm font-medium">
                                            {item.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {item.kind === 'service'
                                                ? 'Service'
                                                : out
                                                  ? 'Out of stock'
                                                  : `${item.stock} in stock`}
                                        </span>
                                        <span className="mt-auto font-display text-lg">
                                            {money(item.price)}
                                        </span>
                                    </button>
                                );
                            })}
                            {catalogue.length === 0 && (
                                <p className="col-span-full py-8 text-sm text-muted-foreground">
                                    Nothing matches that search.
                                </p>
                            )}
                        </div>
                    </section>

                    <aside
                        id="sale"
                        className="flex h-fit flex-col gap-4 border border-border bg-background p-4 pb-24 lg:pb-4"
                    >
                        <div>
                            <h2 className="font-display text-xl">Sale</h2>
                            <p className="text-sm text-muted-foreground">
                                {lines.length === 0
                                    ? 'No items yet'
                                    : `${lines.length} ${lines.length === 1 ? 'line' : 'lines'}`}
                            </p>
                        </div>

                        <ul className="flex flex-col divide-y divide-border">
                            {lines.map((line) => (
                                <li
                                    key={key(line)}
                                    className="flex items-start gap-2 py-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">
                                            {line.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {money(line.price)} each
                                        </p>
                                        <div className="mt-2 inline-flex items-center border border-border">
                                            <button
                                                type="button"
                                                aria-label={`Fewer ${line.name}`}
                                                onClick={() =>
                                                    changeQuantity(line, -1)
                                                }
                                                className="px-2 py-1 hover:bg-mist dark:hover:bg-white/5"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="w-8 text-center text-sm tabular-nums">
                                                {line.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                aria-label={`More ${line.name}`}
                                                onClick={() =>
                                                    changeQuantity(line, 1)
                                                }
                                                className="px-2 py-1 hover:bg-mist dark:hover:bg-white/5"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-sm tabular-nums">
                                            {money(line.price * line.quantity)}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${line.name}`}
                                            onClick={() =>
                                                setLines((current) =>
                                                    current.filter(
                                                        (item) => item !== line,
                                                    ),
                                                )
                                            }
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                            {lines.length === 0 && (
                                <li className="py-6 text-sm text-muted-foreground">
                                    Tap a service or a product to start the
                                    sale.
                                </li>
                            )}
                        </ul>

                        <div className="flex flex-col gap-2 border-t border-border pt-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Subtotal
                                </span>
                                <span className="tabular-nums">
                                    {money(subtotal)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={discountType}
                                    onChange={(event) =>
                                        setDiscountType(event.target.value)
                                    }
                                    aria-label="Discount type"
                                    className="h-9 border border-border bg-background px-2 text-sm"
                                >
                                    <option value="none">No discount</option>
                                    <option value="percent">Percent off</option>
                                    <option value="fixed">Amount off</option>
                                </select>
                                {discountType !== 'none' && (
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={discountValue}
                                        onChange={(event) =>
                                            setDiscountValue(event.target.value)
                                        }
                                        placeholder="0"
                                        aria-label="Discount value"
                                        className="h-9"
                                    />
                                )}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Discount
                                </span>
                                <span className="text-destructive tabular-nums">
                                    {discount > 0
                                        ? `- ${money(discount)}`
                                        : money(0)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-border pt-2">
                                <span className="font-display text-lg">
                                    Total
                                </span>
                                <span className="font-display text-2xl tabular-nums">
                                    {money(total)}
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-2 border-t border-border pt-4">
                            <Label htmlFor="client-name">Client</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    id="client-name"
                                    value={clientName}
                                    onChange={(event) =>
                                        setClientName(event.target.value)
                                    }
                                    placeholder="Walk-in"
                                />
                                <Input
                                    id="client-phone"
                                    value={clientPhone}
                                    onChange={(event) =>
                                        setClientPhone(event.target.value)
                                    }
                                    placeholder="09XX XXX XXXX"
                                    aria-label="Client phone"
                                />
                            </div>
                            {promotions.length > 0 && (
                                <select
                                    value={promotionId}
                                    onChange={(event) =>
                                        setPromotionId(event.target.value)
                                    }
                                    aria-label="Promotion"
                                    className="h-9 border border-border bg-background px-2 text-sm"
                                >
                                    <option value="">No promotion</option>
                                    {promotions.map((promotion) => (
                                        <option
                                            key={promotion.id}
                                            value={promotion.id}
                                        >
                                            {promotion.title}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 border-t border-border pt-4">
                            <Label>Payment</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(methods)
                                    .filter(([key]) =>
                                        available_methods.includes(key),
                                    )
                                    .map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setMethod(key)}
                                            className={cn(
                                                'h-10 border px-2 text-sm transition-colors duration-150 ease-out',
                                                method === key
                                                    ? 'border-plum bg-plum text-white'
                                                    : 'border-border bg-background hover:bg-mist dark:hover:bg-white/5',
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={tendered}
                                    onChange={(event) =>
                                        setTendered(event.target.value)
                                    }
                                    placeholder={`${total.toFixed(2)} exact`}
                                    aria-label="Amount tendered"
                                    className="h-10"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setTendered(total.toFixed(2))
                                    }
                                    className="h-10"
                                >
                                    Exact
                                </Button>
                            </div>
                            {tenderedAmount > total && (
                                <p className="text-sm text-muted-foreground">
                                    Change{' '}
                                    <span className="text-foreground tabular-nums">
                                        {money(change)}
                                    </span>
                                </p>
                            )}
                            {tenderedAmount > 0 && due > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {money(due)} still due
                                </p>
                            )}
                            <Button
                                type="button"
                                onClick={complete}
                                disabled={lines.length === 0 || busy}
                                className="h-11 bg-plum text-white hover:bg-plum-deep"
                            >
                                {busy && <Spinner />}
                                {lines.length === 0
                                    ? 'Add an item to start'
                                    : `Charge ${money(total)}`}
                            </Button>
                        </div>
                    </aside>
                </div>
            </div>

            <a
                href="#sale"
                className="press fixed inset-x-0 bottom-0 z-20 flex items-center justify-between border-t border-border bg-background px-4 py-3 lg:hidden"
            >
                <span className="text-sm text-muted-foreground">
                    {lines.length === 0
                        ? 'No items yet'
                        : `${lines.length} ${lines.length === 1 ? 'line' : 'lines'}`}
                </span>
                <span className="font-display text-lg tabular-nums">
                    {money(total)}
                </span>
            </a>
        </>
    );
}
