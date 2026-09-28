import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import {
    ProductPicker,
    type PickableProduct,
} from '@/components/inventory/product-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { money } from '@/lib/pos';
import inventory from '@/routes/admin/inventory';

type Line = {
    product_id: number;
    quantity: string;
    lot_number: string;
    expires_on: string;
    cost: string;
    supplier_id: string;
    note: string;
};

const blankLine = (): Line => ({
    product_id: 0,
    quantity: '',
    lot_number: '',
    expires_on: '',
    cost: '',
    supplier_id: '',
    note: '',
});

type Props = {
    branch_id: number;
    branch: { id: number; name: string } | null;
    branches: { id: number; name: string }[];
    product_id: number | null;
    products: PickableProduct[];
    suppliers: { id: number; name: string }[];
};

export default function InventoryReceive({
    branch_id,
    branch,
    branches,
    product_id,
    products,
    suppliers,
}: Props) {
    const form = useForm<{ branch_id: number; lines: Line[] }>({
        branch_id,
        lines: [{ ...blankLine(), product_id: product_id ?? 0 }],
    });

    const setLine = (index: number, patch: Partial<Line>) =>
        form.setData(
            'lines',
            form.data.lines.map((line, i) =>
                i === index ? { ...line, ...patch } : line,
            ),
        );

    const units = form.data.lines.reduce(
        (sum, line) => sum + (Number(line.quantity) || 0),
        0,
    );
    const value = form.data.lines.reduce(
        (sum, line) =>
            sum +
            (Number(line.quantity) || 0) *
                (Number(line.cost) ||
                    products.find((p) => p.id === line.product_id)?.cost ||
                    0),
        0,
    );
    const ready = form.data.lines.filter((line) => line.product_id > 0);

    return (
        <>
            <Head title="Receive stock" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Link
                            href={
                                inventory.index({
                                    query: { branch: branch_id },
                                }).url
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
                            A whole delivery in one go. Each line becomes its
                            own lot with its own expiry, so stock is used up
                            oldest first.
                        </p>
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="branch">Into</Label>
                        <select
                            id="branch"
                            value={form.data.branch_id}
                            onChange={(event) =>
                                router.visit(
                                    inventory.receive({
                                        query: {
                                            branch: Number(event.target.value),
                                        },
                                    }).url,
                                )
                            }
                            className="h-10 border border-border bg-background px-2 text-sm"
                        >
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </header>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(inventory.receive.store().url);
                    }}
                    className="flex flex-col gap-4"
                >
                    {form.data.lines.map((line, index) => {
                        const product = products.find(
                            (p) => p.id === line.product_id,
                        );
                        const after =
                            (product?.on_hand ?? 0) +
                            (Number(line.quantity) || 0);

                        return (
                            <fieldset
                                key={index}
                                className="grid gap-4 border border-border bg-background p-4 lg:grid-cols-12"
                            >
                                <legend className="sr-only">
                                    Item {index + 1}
                                </legend>

                                <div className="grid gap-1 lg:col-span-4">
                                    <Label htmlFor={`product-${index}`}>
                                        Item
                                    </Label>
                                    <ProductPicker
                                        id={`product-${index}`}
                                        products={products}
                                        value={line.product_id || null}
                                        takenIds={form.data.lines
                                            .filter((_, i) => i !== index)
                                            .map((l) => l.product_id)
                                            .filter(Boolean)}
                                        onChange={(id) =>
                                            setLine(index, {
                                                product_id: id,
                                                cost:
                                                    String(
                                                        products.find(
                                                            (p) => p.id === id,
                                                        )?.cost ?? '',
                                                    ) || '',
                                            })
                                        }
                                    />
                                    {form.errors[
                                        `lines.${index}.product_id`
                                    ] && (
                                        <p className="text-sm text-destructive">
                                            {
                                                form.errors[
                                                    `lines.${index}.product_id`
                                                ]
                                            }
                                        </p>
                                    )}
                                    {product && (
                                        <p className="text-xs text-muted-foreground">
                                            {product.on_hand} on hand now
                                            {Number(line.quantity) > 0 && (
                                                <> · {after} after this</>
                                            )}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-1 lg:col-span-2">
                                    <Label htmlFor={`quantity-${index}`}>
                                        Units
                                    </Label>
                                    <Input
                                        id={`quantity-${index}`}
                                        type="number"
                                        min={1}
                                        value={line.quantity}
                                        onChange={(event) =>
                                            setLine(index, {
                                                quantity: event.target.value,
                                            })
                                        }
                                        required
                                    />
                                    {form.errors[`lines.${index}.quantity`] && (
                                        <p className="text-sm text-destructive">
                                            {
                                                form.errors[
                                                    `lines.${index}.quantity`
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-1 lg:col-span-2">
                                    <Label htmlFor={`lot-${index}`}>Lot</Label>
                                    <Input
                                        id={`lot-${index}`}
                                        value={line.lot_number}
                                        onChange={(event) =>
                                            setLine(index, {
                                                lot_number: event.target.value,
                                            })
                                        }
                                        placeholder="Optional"
                                    />
                                </div>

                                <div className="grid gap-1 lg:col-span-2">
                                    <Label htmlFor={`expires-${index}`}>
                                        Expires
                                    </Label>
                                    <Input
                                        id={`expires-${index}`}
                                        type="date"
                                        value={line.expires_on}
                                        onChange={(event) =>
                                            setLine(index, {
                                                expires_on: event.target.value,
                                            })
                                        }
                                    />
                                    {form.errors[
                                        `lines.${index}.expires_on`
                                    ] && (
                                        <p className="text-sm text-destructive">
                                            {
                                                form.errors[
                                                    `lines.${index}.expires_on`
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-1 lg:col-span-2">
                                    <Label htmlFor={`cost-${index}`}>
                                        Cost each
                                    </Label>
                                    <Input
                                        id={`cost-${index}`}
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={line.cost}
                                        onChange={(event) =>
                                            setLine(index, {
                                                cost: event.target.value,
                                            })
                                        }
                                        placeholder={String(
                                            product?.cost ?? '',
                                        )}
                                    />
                                </div>

                                <div className="flex items-end justify-between gap-2 lg:col-span-12">
                                    <div className="grid flex-1 gap-1 sm:grid-cols-2">
                                        <Input
                                            aria-label={`Note for item ${index + 1}`}
                                            value={line.note}
                                            onChange={(event) =>
                                                setLine(index, {
                                                    note: event.target.value,
                                                })
                                            }
                                            placeholder="Delivery 4471, two cases"
                                        />
                                        <select
                                            aria-label={`Supplier for item ${index + 1}`}
                                            value={line.supplier_id ?? ''}
                                            onChange={(event) =>
                                                setLine(index, {
                                                    supplier_id:
                                                        event.target.value,
                                                })
                                            }
                                            className="h-10 border border-border bg-background px-2 text-sm"
                                        >
                                            <option value="">
                                                Supplier not recorded
                                            </option>
                                            {suppliers.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {form.data.lines.length > 1 && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                form.setData(
                                                    'lines',
                                                    form.data.lines.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                )
                                            }
                                            aria-label={`Remove item ${index + 1}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </fieldset>
                        );
                    })}

                    {form.errors.lines && (
                        <p className="text-sm text-destructive">
                            {form.errors.lines}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                form.setData('lines', [
                                    ...form.data.lines,
                                    blankLine(),
                                ])
                            }
                            className="h-10"
                        >
                            <Plus className="h-4 w-4" />
                            Add another item
                        </Button>

                        {units > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {units} {units === 1 ? 'unit' : 'units'} across{' '}
                                {ready.length}{' '}
                                {ready.length === 1 ? 'item' : 'items'}
                                {value > 0 && ` · ${money(value)}`}
                            </p>
                        )}

                        <Button
                            type="submit"
                            disabled={form.processing || ready.length === 0}
                            className="ml-auto h-11 bg-plum text-white hover:bg-plum-deep"
                        >
                            {form.processing && <Spinner />}
                            {ready.length > 1
                                ? `Receive ${ready.length} items into ${branch?.name ?? 'this branch'}`
                                : 'Receive'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
