import type { Labels } from '@/lib/admin';

export type StockRow = {
    id: number;
    name: string;
    sku: string | null;
    category: string;
    price: number;
    cost: number;
    on_hand: number;
    reorder_level: number;
    value: number;
    lots: number;
    expired_units: number;
    expiring_units: number;
    next_expiry: string | null;
    next_expiry_days: number | null;
    status: string;
};

export type Movement = {
    id: number;
    product: string;
    sku: string | null;
    type: string;
    type_label: string;
    quantity: number;
    cost: number;
    lot: string | null;
    reference: string | null;
    note: string | null;
    by: string | null;
    when: string;
};

export type Batch = {
    id: number;
    lot_number: string | null;
    expires_on: string | null;
    days_to_expiry: number | null;
    received_on: string;
    quantity: number;
    cost: number;
    supplier: string | null;
    note: string | null;
    expired: boolean;
};

export const STATUS_LABELS: Labels = {
    ok: 'In stock',
    expiring: 'Expiring',
    expired: 'Expired',
    low: 'Low stock',
    out: 'Out of stock',
};

/** Where a line sits: what needs doing about it, not decoration. */
export const stockTone = (status: string): string =>
    ({
        ok: 'border-border text-muted-foreground bg-background',
        expiring: 'border-gold text-gold-deep bg-background',
        expired: 'border-destructive/40 text-destructive bg-background',
        low: 'border-gold text-gold-deep bg-background',
        out: 'border-destructive/40 text-destructive bg-background',
    })[status] ?? 'border-border';

export const movementTone = (quantity: number): string =>
    quantity > 0 ? 'text-plum' : 'text-destructive';

export const signed = (quantity: number): string =>
    `${quantity > 0 ? '+' : ''}${quantity}`;
