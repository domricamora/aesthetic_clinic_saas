import type { Labels } from '@/lib/admin';

const peso = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/** Money always shows centavos on the counter: 2,990.00. */
export const money = (value: number): string => peso.format(value);

export type Sellable = {
    kind: 'service' | 'product';
    id: number;
    name: string;
    price: number;
    stock: number | null;
};

export type CartLine = Sellable & { quantity: number };

export type SaleRow = {
    id: number;
    reference: string;
    client: string;
    branch: string | null;
    cashier: string | null;
    total: number;
    amount_paid: number;
    balance: number;
    status: string;
    created_at: string;
};

export type SaleDetail = {
    id: number;
    reference: string;
    status: string;
    client_name: string | null;
    client_phone: string | null;
    client: string;
    branch: string | null;
    cashier: string | null;
    promotion: string | null;
    note: string | null;
    subtotal: number;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    total: number;
    amount_paid: number;
    balance: number;
    paid_at: string | null;
    created_at: string;
    items: {
        kind: string;
        description: string;
        quantity: number;
        unit_price: number;
        line_total: number;
    }[];
    payments: {
        id: number;
        method: string;
        method_label: string;
        type: string;
        amount: number;
        reference: string | null;
        note: string | null;
        taken_by: string | null;
        paid_at: string;
    }[];
};

export const statusTone = (status: string): string =>
    ({
        paid: 'border-plum/30 text-plum bg-lilac/60',
        partial: 'border-gold text-gold-deep bg-background',
        unpaid: 'border-destructive/40 text-destructive bg-background',
        refunded: 'border-border text-muted-foreground bg-muted',
        void: 'border-border text-muted-foreground line-through bg-background',
    })[status] ?? 'border-border';

/** What the register shows as it is rung up. The server has the final word. */
export function cartTotals(
    lines: CartLine[],
    discountType: string,
    discountValue: number,
): { subtotal: number; discount: number; total: number } {
    const subtotal = lines.reduce(
        (sum, line) => sum + line.price * line.quantity,
        0,
    );
    const discount =
        discountType === 'percent'
            ? (subtotal * Math.min(Math.max(discountValue, 0), 100)) / 100
            : discountType === 'fixed'
              ? Math.min(Math.max(discountValue, 0), subtotal)
              : 0;

    return { subtotal, discount, total: Math.max(0, subtotal - discount) };
}

export type RegisterProps = {
    branch_id: number;
    branches: { id: number; name: string }[];
    lead: { id: number; name: string; phone: string | null } | null;
    query: string;
    services: Sellable[];
    products: Sellable[];
    promotions: { id: number; title: string }[];
    methods: Labels;
    available_methods: string[];
    statuses: Labels;
};
