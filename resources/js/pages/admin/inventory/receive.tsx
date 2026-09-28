import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { money } from '@/lib/pos';
import inventory from '@/routes/admin/inventory';

type Product = { id: number; name: string; sku: string | null; cost: number };
type Props = {
    branch_id: number;
    branches: { id: number; name: string }[];
    products: Product[];
    suppliers: { id: number; name: string }[];
};

export default function InventoryReceive({
    branch_id,
    branches,
    products,
    suppliers,
}: Props) {
    const form = useForm({
        product_id: products[0]?.id ?? 0,
        branch_id: branch_id,
        quantity: '',
        lot_number: '',
        expires_on: '',
        received_on: new Date().toISOString().slice(0, 10),
        supplier_id: '',
        cost: '',
        note: '',
    });

    const product = products.find(
        (item) => item.id === Number(form.data.product_id),
    );
    const unitCost = Number(form.data.cost) || product?.cost || 0;

    return (
        <>
            <Head title="Receive stock" />
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
                        Receive stock
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        A delivery becomes a new lot with its own expiry, so
                        stock is used up oldest first.
                    </p>
                </header>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(inventory.receive.store().url);
                    }}
                    className="grid max-w-3xl gap-4 border border-border bg-background p-6"
                >
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
                        {form.errors.product_id && (
                            <p className="text-sm text-destructive">
                                {form.errors.product_id}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1">
                            <Label htmlFor="branch">Branch</Label>
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
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="quantity">Units</Label>
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
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1">
                            <Label htmlFor="lot">Lot number</Label>
                            <Input
                                id="lot"
                                value={form.data.lot_number}
                                onChange={(event) =>
                                    form.setData(
                                        'lot_number',
                                        event.target.value,
                                    )
                                }
                                placeholder="LOT-0421"
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="expires">Expires on</Label>
                            <Input
                                id="expires"
                                type="date"
                                value={form.data.expires_on}
                                onChange={(event) =>
                                    form.setData(
                                        'expires_on',
                                        event.target.value,
                                    )
                                }
                            />
                            {form.errors.expires_on && (
                                <p className="text-sm text-destructive">
                                    {form.errors.expires_on}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-1">
                            <Label htmlFor="supplier">Supplier</Label>
                            <select
                                id="supplier"
                                value={form.data.supplier_id}
                                onChange={(event) =>
                                    form.setData(
                                        'supplier_id',
                                        event.target.value,
                                    )
                                }
                                className="h-10 border border-border bg-background px-2 text-sm"
                            >
                                <option value="">Not recorded</option>
                                {suppliers.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="cost">Cost each</Label>
                            <Input
                                id="cost"
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.data.cost}
                                onChange={(event) =>
                                    form.setData('cost', event.target.value)
                                }
                                placeholder={String(product?.cost ?? '')}
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="received">Received on</Label>
                            <Input
                                id="received"
                                type="date"
                                value={form.data.received_on}
                                onChange={(event) =>
                                    form.setData(
                                        'received_on',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="note">Note</Label>
                        <Input
                            id="note"
                            value={form.data.note}
                            onChange={(event) =>
                                form.setData('note', event.target.value)
                            }
                            placeholder="Delivery 4471, two cases"
                        />
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {Number(form.data.quantity || 0) * unitCost > 0 &&
                            `Stock value ${money(Number(form.data.quantity || 0) * unitCost)}.`}
                    </p>

                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="h-11 justify-self-start bg-plum text-white hover:bg-plum-deep"
                    >
                        {form.processing && <Spinner />}
                        Receive
                    </Button>
                </form>
            </div>
        </>
    );
}
