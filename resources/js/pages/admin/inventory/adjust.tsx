import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import {
    ProductPicker,
    type PickableProduct,
} from '@/components/inventory/product-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import inventory from '@/routes/admin/inventory';

type Props = {
    branch_id: number;
    branch: { id: number; name: string } | null;
    branches: { id: number; name: string }[];
    product_id: number | null;
    products: PickableProduct[];
    suppliers: { id: number; name: string }[];
    types: Record<string, string>;
};

export default function InventoryAdjust({
    branch_id,
    branches,
    product_id,
    products,
    types,
}: Props) {
    const form = useForm({
        product_id: product_id ?? 0,
        branch_id,
        kind: 'adjustment',
        mode: 'count',
        quantity: '',
        to_branch: '',
        note: '',
    });

    const product = products.find((p) => p.id === form.data.product_id) ?? null;
    const onHand = product?.on_hand ?? 0;
    const entered = Number(form.data.quantity);
    const isTransfer = form.data.kind === 'transfer';
    const isCount =
        form.data.kind === 'adjustment' && form.data.mode === 'count';

    // What the count will actually do to the shelf, worked out as you type so
    // there is no guessing about what gets saved.
    const change = isCount
        ? (Number.isFinite(entered) ? entered : 0) - onHand
        : Number.isFinite(entered)
          ? entered
          : 0;

    return (
        <>
            <Head title="Adjust stock" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header>
                    <Link
                        href={
                            inventory.index({ query: { branch: branch_id } })
                                .url
                        }
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Inventory
                    </Link>
                    <h1 className="mt-2 font-display text-3xl md:text-4xl">
                        Adjust stock
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Stock leaves oldest expiry first. Count what is on the
                        shelf and the difference is worked out for you.
                    </p>
                </header>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(inventory.adjust.store().url);
                    }}
                    className="grid max-w-3xl gap-4 border border-border bg-background p-6"
                >
                    <div className="grid gap-1">
                        <Label>What happened</Label>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {Object.entries(types).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => form.setData('kind', key)}
                                    aria-pressed={form.data.kind === key}
                                    className={cn(
                                        'h-10 border px-3 text-left text-sm transition-colors duration-150 ease-out',
                                        form.data.kind === key
                                            ? 'border-plum bg-plum text-white'
                                            : 'border-border bg-background hover:bg-mist dark:hover:bg-white/5',
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        {form.errors.kind && (
                            <p className="text-sm text-destructive">
                                {form.errors.kind}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="product">Item</Label>
                        <ProductPicker
                            id="product"
                            products={products}
                            value={form.data.product_id || null}
                            onChange={(id) =>
                                form.setData({
                                    product_id: id,
                                    quantity: '',
                                })
                            }
                        />
                        {form.errors.product_id && (
                            <p className="text-sm text-destructive">
                                {form.errors.product_id}
                            </p>
                        )}
                        {product && (
                            <p className="text-sm text-muted-foreground">
                                <span className="tabular-nums">{onHand}</span>{' '}
                                on hand at this branch
                            </p>
                        )}
                    </div>

                    {isTransfer ? (
                        <div className="grid gap-1">
                            <Label htmlFor="to_branch">Move to</Label>
                            <select
                                id="to_branch"
                                value={form.data.to_branch}
                                onChange={(event) =>
                                    form.setData(
                                        'to_branch',
                                        event.target.value,
                                    )
                                }
                                className="h-10 border border-border bg-background px-2 text-sm"
                            >
                                <option value="">Choose a branch</option>
                                {branches
                                    .filter(
                                        (item) =>
                                            item.id !== form.data.branch_id,
                                    )
                                    .map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                            </select>
                            {form.errors.to_branch && (
                                <p className="text-sm text-destructive">
                                    {form.errors.to_branch}
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            {form.data.kind === 'adjustment' && (
                                <div className="grid gap-1">
                                    <Label>How are you entering it</Label>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                form.setData({
                                                    mode: 'count',
                                                    quantity: '',
                                                })
                                            }
                                            aria-pressed={
                                                form.data.mode === 'count'
                                            }
                                            className={cn(
                                                'h-10 border px-3 text-left text-sm transition-colors duration-150 ease-out',
                                                form.data.mode === 'count'
                                                    ? 'border-plum bg-plum text-white'
                                                    : 'border-border bg-background hover:bg-mist dark:hover:bg-white/5',
                                            )}
                                        >
                                            What I counted
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                form.setData({
                                                    mode: 'delta',
                                                    quantity: '',
                                                })
                                            }
                                            aria-pressed={
                                                form.data.mode === 'delta'
                                            }
                                            className={cn(
                                                'h-10 border px-3 text-left text-sm transition-colors duration-150 ease-out',
                                                form.data.mode === 'delta'
                                                    ? 'border-plum bg-plum text-white'
                                                    : 'border-border bg-background hover:bg-mist dark:hover:bg-white/5',
                                            )}
                                        >
                                            The change
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-1">
                                <Label htmlFor="quantity">
                                    {isCount
                                        ? 'Units counted on the shelf'
                                        : isTransfer
                                          ? 'Units to move'
                                          : 'Units removed'}
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min={
                                        form.data.mode === 'count' ? 0 : -100000
                                    }
                                    max={100000}
                                    value={form.data.quantity}
                                    onChange={(event) =>
                                        form.setData(
                                            'quantity',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                                {form.errors.quantity && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.quantity}
                                    </p>
                                )}
                                {isCount && form.data.quantity !== '' && (
                                    <p
                                        className={cn(
                                            'text-sm tabular-nums',
                                            change === 0
                                                ? 'text-muted-foreground'
                                                : change > 0
                                                  ? 'text-plum'
                                                  : 'text-destructive',
                                        )}
                                    >
                                        {change === 0
                                            ? 'Matches the system. Nothing will change.'
                                            : change > 0
                                              ? `${change} more than the system has. They will be added.`
                                              : `${Math.abs(change)} short of the system. They will be written off.`}
                                    </p>
                                )}
                                {form.data.mode === 'delta' &&
                                    form.data.kind === 'adjustment' && (
                                        <p className="text-sm text-muted-foreground">
                                            A negative number records stock that
                                            has gone missing.
                                        </p>
                                    )}
                            </div>
                        </>
                    )}

                    <div className="grid gap-1">
                        <Label htmlFor="note">Reason</Label>
                        <Input
                            id="note"
                            value={form.data.note}
                            onChange={(event) =>
                                form.setData('note', event.target.value)
                            }
                            placeholder="Two jars found broken in the back store"
                        />
                        {form.errors.note && (
                            <p className="text-sm text-destructive">
                                {form.errors.note}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={form.processing || !product}
                        className="h-11 justify-self-start bg-plum text-white hover:bg-plum-deep"
                    >
                        {form.processing && <Spinner />}
                        Record
                    </Button>
                </form>
            </div>
        </>
    );
}
