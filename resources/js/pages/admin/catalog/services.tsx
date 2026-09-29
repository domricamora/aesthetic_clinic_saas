import { useForm } from '@inertiajs/react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { money } from '@/lib/pos';
import { cn } from '@/lib/utils';
import catalog from '@/routes/admin/catalog';

export type ServiceRow = {
    id: number;
    name: string;
    summary: string | null;
    description: string | null;
    price: number;
    promo_price: number | null;
    duration_minutes: number;
    category_id: number;
    category: string | null;
    is_active: boolean;
    sold: number;
    booked: number;
    image: string | null;
};

type Props = {
    services: ServiceRow[];
    categories: { id: number; name: string }[];
    canEdit: boolean;
};

const empty = {
    name: '',
    summary: '',
    description: '',
    duration_minutes: '60',
    price: '',
    promo_price: '',
    treatment_category_id: '',
    recommended_sessions: '',
    is_active: 1,
};

export function ServiceCatalogue({ services, categories, canEdit }: Props) {
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<number | null>(null);
    const [busy, setBusy] = useState<number | null>(null);
    const [photoError, setPhotoError] = useState('');
    const create = useForm({
        ...empty,
        treatment_category_id: String(categories[0]?.id ?? ''),
    });
    const update = useForm({ ...empty });

    const csrf = () =>
        (document.querySelector('meta[name=csrf-token]') as HTMLMetaElement)
            ?.content ?? '';

    const sendPhoto = (row: ServiceRow, file: File) => {
        const body = new FormData();
        body.append('photo', file);
        setBusy(row.id);
        setPhotoError('');

        fetch(catalog.services.photo(row.id).url, {
            method: 'POST',
            body,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrf(),
            },
        })
            .then(async (response) => {
                const payload = await response.json();
                if (!response.ok) {
                    setPhotoError(
                        payload.message ?? 'That photo did not upload.',
                    );
                } else {
                    // Reload rather than patching the row locally: the treatment
                    // page and the category grid both read this image, and a
                    // stale value in one list is how a photo ends up missing
                    // from the site after it was uploaded.
                    window.location.reload();
                }
            })
            .catch(() => setPhotoError('That photo did not upload.'))
            .finally(() => setBusy(null));
    };

    const clearPhoto = (row: ServiceRow) => {
        setBusy(row.id);
        setPhotoError('');

        fetch(catalog.services.photo.destroy(row.id).url, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrf(),
            },
        })
            .then(() => window.location.reload())
            .catch(() => setPhotoError('That photo did not remove.'))
            .finally(() => setBusy(null));
    };

    /**
     * One control for a treatment photograph: what is on the site now, and a
     * way to replace or remove it. A treatment with no picture is the page a
     * clinic owner notices first, so the empty state says so rather than
     * showing an empty box.
     */
    const photoCell = (row: ServiceRow) => (
        <div className="flex items-center gap-2">
            {row.image ? (
                <img
                    src={row.image}
                    alt=""
                    className="size-12 shrink-0 object-cover"
                />
            ) : (
                <span className="flex size-12 shrink-0 items-center justify-center border border-dashed border-border text-[10px] text-muted-foreground">
                    No photo
                </span>
            )}

            {canEdit && (
                <div className="flex flex-col gap-1">
                    <label className="cursor-pointer text-xs underline">
                        {busy === row.id ? 'Working...' : 'Upload'}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            disabled={busy === row.id}
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) sendPhoto(row, file);
                            }}
                        />
                    </label>
                    {row.image && (
                        <button
                            type="button"
                            onClick={() => clearPhoto(row)}
                            disabled={busy === row.id}
                            className="text-xs text-muted-foreground underline"
                        >
                            Remove
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    const startEdit = (row: ServiceRow) => {
        setEditing(row.id);
        update.setData({
            name: row.name,
            summary: row.summary ?? '',
            description: row.description ?? '',
            duration_minutes: String(row.duration_minutes),
            price: String(row.price),
            promo_price: row.promo_price ? String(row.promo_price) : '',
            treatment_category_id: String(row.category_id ?? ''),
            recommended_sessions: '',
            is_active: row.is_active ? 1 : 0,
        });
    };

    const used = (row: ServiceRow) => row.sold > 0 || row.booked > 0;

    const field = (
        form: typeof create,
        key: keyof typeof empty,
        label: string,
        type: 'text' | 'number' = 'text',
        extra = '',
    ) => (
        <div className="grid gap-1">
            <Label htmlFor={`${key}-${form === create ? 'new' : editing}`}>
                {label}
            </Label>
            <Input
                id={`${key}-${form === create ? 'new' : editing}`}
                type={type}
                value={form.data[key] as string}
                onChange={(event) => form.setData(key, event.target.value)}
                className={extra}
            />
            {form.errors[key] && (
                <p className="text-sm text-destructive">{form.errors[key]}</p>
            )}
        </div>
    );

    return (
        <div className="flex flex-col gap-4">
            {/* An upload that fails with no message reads as a photograph that
                simply did not change, and the office would try again forever. */}
            {photoError && (
                <p className="text-sm text-destructive">{photoError}</p>
            )}
            {canEdit && (
                <div className="flex justify-end">
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
                        {adding ? 'Cancel' : 'Add service'}
                    </Button>
                </div>
            )}

            {adding && (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        create.post(catalog.services.store().url, {
                            preserveScroll: true,
                            onSuccess: () => {
                                create.reset();
                                setAdding(false);
                            },
                        });
                    }}
                    className="grid gap-4 border border-border bg-background p-6 sm:grid-cols-3"
                >
                    <div className="grid gap-1 sm:col-span-2">
                        <Label htmlFor="new-name">Name</Label>
                        <Input
                            id="new-name"
                            value={create.data.name}
                            onChange={(e) =>
                                create.setData('name', e.target.value)
                            }
                            placeholder="Hydra Facial"
                            required
                        />
                        {create.errors.name && (
                            <p className="text-sm text-destructive">
                                {create.errors.name}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="new-category">Category</Label>
                        <select
                            id="new-category"
                            value={create.data.treatment_category_id}
                            onChange={(e) =>
                                create.setData(
                                    'treatment_category_id',
                                    e.target.value,
                                )
                            }
                            className="h-10 border border-border bg-background px-2 text-sm"
                        >
                            <option value="">Uncategorised</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {field(
                        create,
                        'price',
                        'Price',
                        'number',
                        'h-10 text-right tabular-nums',
                    )}
                    {field(
                        create,
                        'promo_price',
                        'Promo price',
                        'number',
                        'h-10 text-right tabular-nums',
                    )}
                    {field(
                        create,
                        'duration_minutes',
                        'Minutes',
                        'number',
                        'h-10 text-right tabular-nums',
                    )}
                    <div className="grid gap-1 sm:col-span-2">
                        <Label htmlFor="new-summary">Summary</Label>
                        <Input
                            id="new-summary"
                            value={create.data.summary}
                            onChange={(e) =>
                                create.setData('summary', e.target.value)
                            }
                            placeholder="One line for the website"
                            required
                        />
                        {create.errors.summary && (
                            <p className="text-sm text-destructive">
                                {create.errors.summary}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-1 sm:col-span-3">
                        <Label htmlFor="new-description">Description</Label>
                        <Textarea
                            id="new-description"
                            value={create.data.description}
                            onChange={(e) =>
                                create.setData('description', e.target.value)
                            }
                            placeholder="What a client reads before booking"
                            required
                        />
                        {create.errors.description && (
                            <p className="text-sm text-destructive">
                                {create.errors.description}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2 sm:col-span-3">
                        <Button
                            type="submit"
                            disabled={create.processing}
                            className="h-10 bg-plum text-white hover:bg-plum-deep"
                        >
                            {create.processing && <Spinner />}
                            Add service
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

            <div className="overflow-x-auto border border-border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                            <th className="px-4 py-3 font-normal">Photo</th>
                            <th className="px-4 py-3 font-normal">Service</th>
                            <th className="px-4 py-3 text-right font-normal">
                                Price
                            </th>
                            <th className="px-4 py-3 text-right font-normal">
                                Minutes
                            </th>
                            <th className="px-4 py-3 text-right font-normal">
                                Used
                            </th>
                            <th className="px-4 py-3 font-normal">Status</th>
                            {canEdit && (
                                <th className="px-4 py-3 font-normal" />
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {services.map((row) =>
                            editing === row.id ? (
                                <tr
                                    key={row.id}
                                    className="border-b border-border bg-lilac/20"
                                >
                                    <td className="px-4 py-3" colSpan={3}>
                                        <div className="grid gap-2">
                                            <Input
                                                aria-label="Name"
                                                value={update.data.name}
                                                onChange={(e) =>
                                                    update.setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <select
                                                aria-label="Category"
                                                value={
                                                    update.data
                                                        .treatment_category_id
                                                }
                                                onChange={(e) =>
                                                    update.setData(
                                                        'treatment_category_id',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-9 border border-border bg-background px-2 text-sm"
                                            >
                                                {categories.map((c) => (
                                                    <option
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <Input
                                                aria-label="Summary"
                                                value={update.data.summary}
                                                onChange={(e) =>
                                                    update.setData(
                                                        'summary',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="grid gap-1">
                                            <Input
                                                aria-label="Price"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={update.data.price}
                                                onChange={(e) =>
                                                    update.setData(
                                                        'price',
                                                        e.target.value,
                                                    )
                                                }
                                                className="text-right tabular-nums"
                                            />
                                            <Input
                                                aria-label="Promo price"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                placeholder="No promo"
                                                value={update.data.promo_price}
                                                onChange={(e) =>
                                                    update.setData(
                                                        'promo_price',
                                                        e.target.value,
                                                    )
                                                }
                                                className="text-right tabular-nums"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Input
                                            aria-label="Minutes"
                                            type="number"
                                            min={5}
                                            value={update.data.duration_minutes}
                                            onChange={(e) =>
                                                update.setData(
                                                    'duration_minutes',
                                                    e.target.value,
                                                )
                                            }
                                            className="text-right tabular-nums"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                        {row.sold + row.booked}
                                    </td>
                                    <td className="px-4 py-3">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    update.data.is_active === 1
                                                }
                                                onChange={(e) =>
                                                    update.setData(
                                                        'is_active',
                                                        e.target.checked
                                                            ? 1
                                                            : 0,
                                                    )
                                                }
                                            />
                                            On the menu
                                        </label>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={update.processing}
                                                onClick={() =>
                                                    update.patch(
                                                        catalog.services.update(
                                                            row.id,
                                                        ).url,
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () =>
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
                                                onClick={() => setEditing(null)}
                                                aria-label="Cancel"
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
                                        {photoCell(row)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {row.name}
                                        {row.summary && (
                                            <span className="block text-xs text-muted-foreground">
                                                {row.summary}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(row.price)}
                                        {row.promo_price &&
                                            row.promo_price < row.price && (
                                                <span className="block text-xs text-plum">
                                                    {money(row.promo_price)}{' '}
                                                    promo
                                                </span>
                                            )}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                        {row.duration_minutes}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                        {row.sold + row.booked > 0
                                            ? `${row.sold + row.booked}`
                                            : '—'}
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
                                                ? 'On the menu'
                                                : 'Retired'}
                                        </span>
                                    </td>
                                    {canEdit && (
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        startEdit(row)
                                                    }
                                                    aria-label={`Edit ${row.name}`}
                                                >
                                                    Edit
                                                </Button>
                                                {!used(row) && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            useForm({}).delete(
                                                                catalog.services.destroy(
                                                                    row.id,
                                                                ).url,
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                        aria-label={`Delete ${row.name}`}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ),
                        )}
                        {services.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-10 text-center text-muted-foreground"
                                >
                                    No services match those filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
