import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import inventory from '@/routes/admin/inventory';

type Product = { id: number; name: string; sku: string | null; cost: number };
type Props = {
    branch_id: number;
    branches: { id: number; name: string }[];
    products: Product[];
    suppliers: { id: number; name: string }[];
    types: Record<string, string>;
};

export default function InventoryAdjust({
    branch_id,
    branches,
    products,
    types,
}: Props) {
    const form = useForm({
        product_id: products[0]?.id ?? 0,
        branch_id: branch_id,
        kind: 'adjustment',
        quantity: '',
        to_branch: '',
        note: '',
    });

    const isTransfer = form.data.kind === 'transfer';
    const isCorrection = form.data.kind === 'adjustment';

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
                        Stock leaves oldest expiry first. Say what happened so
                        the count can be explained later.
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
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1">
                            <Label htmlFor="product">Product</Label>
                            <select
                                id="product"
                                value={form.data.product_id}
                                onChange={(event) =>
                                    form.setData(
                                        'product_id',
                                        Number(event.target.value),
                                    )
                                }
                                className="h-10 border border-border bg-background px-2 text-sm"
                            >
                                {products.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.sku ?? 'no SKU'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="branch">
                                {isTransfer ? 'Move from' : 'Branch'}
                            </Label>
                            <select
                                id="branch"
                                value={form.data.branch_id}
                                onChange={(event) =>
                                    form.setData(
                                        'branch_id',
                                        Number(event.target.value),
                                    )
                                }
                                className="h-10 border border-border bg-background px-2 text-sm"
                            >
                                {branches.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            {form.errors.branch_id && (
                                <p className="text-sm text-destructive">
                                    {form.errors.branch_id}
                                </p>
                            )}
                        </div>
                    </div>

                    {isTransfer && (
                        <div className="grid gap-1">
                            <Label htmlFor="to">Move to</Label>
                            <select
                                id="to"
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
                    )}

                    <div className="grid gap-1">
                        <Label htmlFor="quantity">
                            {isCorrection
                                ? 'Units found (a negative number removes stock)'
                                : 'Units'}
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            min={1}
                            value={form.data.quantity}
                            onChange={(event) =>
                                form.setData('quantity', event.target.value)
                            }
                            required
                        />
                        {form.errors.quantity && (
                            <p className="text-sm text-destructive">
                                {form.errors.quantity}
                            </p>
                        )}
                    </div>

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
                        disabled={form.processing}
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
