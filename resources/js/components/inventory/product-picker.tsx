import { Check, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type PickableProduct = {
    id: number;
    name: string;
    sku: string | null;
    category: string | null;
    cost: number;
    price: number;
    on_hand: number;
};

type Props = {
    products: PickableProduct[];
    value: number | null;
    onChange: (id: number) => void;
    id: string;
    /** Already chosen in another row of the same delivery. */
    takenIds?: number[];
    invalid?: boolean;
    placeholder?: string;
};

/**
 * Choosing an item by scrolling a dropdown gets old fast once a clinic sells a
 * few hundred things, so this filters as you type and shows what is already on
 * the shelf next to each match. Arrow keys move, Enter picks, Escape closes.
 */
export function ProductPicker({
    products,
    value,
    onChange,
    id,
    takenIds = [],
    invalid = false,
    placeholder = 'Search for an item',
}: Props) {
    const [term, setTerm] = useState('');
    const [open, setOpen] = useState(false);
    const [cursor, setCursor] = useState(0);
    const box = useRef<HTMLDivElement>(null);
    const selected = products.find((product) => product.id === value) ?? null;

    const matches = useMemo(() => {
        const needle = term.trim().toLowerCase();

        return products
            .filter((product) => !takenIds.includes(product.id))
            .filter(
                (product) =>
                    needle === '' ||
                    product.name.toLowerCase().includes(needle) ||
                    (product.sku ?? '').toLowerCase().includes(needle) ||
                    (product.category ?? '').toLowerCase().includes(needle),
            )
            .slice(0, 8);
    }, [products, term, takenIds]);

    useEffect(() => {
        const away = (event: MouseEvent) => {
            if (!box.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', away);

        return () => document.removeEventListener('mousedown', away);
    }, []);

    useEffect(() => setCursor(0), [term]);

    const pick = (id: number) => {
        onChange(id);
        setTerm('');
        setOpen(false);
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
            setOpen(true);

            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setCursor((c) => Math.min(c + 1, matches.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
        } else if (event.key === 'Enter' && matches[cursor]) {
            event.preventDefault();
            pick(matches[cursor].id);
        } else if (event.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div className="relative" ref={box}>
            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id={id}
                    role="combobox"
                    aria-expanded={open}
                    aria-autocomplete="list"
                    aria-invalid={invalid || undefined}
                    autoComplete="off"
                    className={cn('h-10 pl-9', selected && 'pr-9')}
                    placeholder={selected ? selected.name : placeholder}
                    value={selected ? selected.name : term}
                    onFocus={() => setOpen(true)}
                    onChange={(event) => {
                        setTerm(event.target.value);
                        setOpen(true);
                    }}
                    onKeyDown={onKeyDown}
                />
                {selected && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange(0);
                            setTerm('');
                        }}
                        className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {open && matches.length > 0 && (
                <ul
                    role="listbox"
                    className="absolute z-20 mt-1 w-full border border-border bg-background shadow-sm"
                >
                    {matches.map((product, index) => (
                        <li key={product.id}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={index === cursor}
                                onClick={() => pick(product.id)}
                                onMouseEnter={() => setCursor(index)}
                                className={cn(
                                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                                    index === cursor && 'bg-lilac/50',
                                )}
                            >
                                <Check
                                    className={cn(
                                        'h-3 w-3 shrink-0',
                                        product.id === value
                                            ? 'text-plum'
                                            : 'text-transparent',
                                    )}
                                />
                                <span className="flex-1 truncate">
                                    {product.name}
                                    <span className="block text-xs text-muted-foreground">
                                        {product.sku ?? 'no SKU'}
                                        {product.category
                                            ? ` · ${product.category}`
                                            : ''}
                                    </span>
                                </span>
                                <span
                                    className={cn(
                                        'shrink-0 text-xs tabular-nums',
                                        product.on_hand > 0
                                            ? 'text-muted-foreground'
                                            : 'text-gold-deep',
                                    )}
                                >
                                    {product.on_hand} on hand
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {open && matches.length === 0 && (
                <div className="absolute z-20 mt-1 w-full border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                    Nothing matches “{term}”.
                </div>
            )}
        </div>
    );
}
