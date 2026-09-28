import { usePage } from '@inertiajs/react';

export type AppointmentRow = {
    id: number;
    reference: string;
    starts_at: string;
    ends_at: string;
    status: string;
    notes: string | null;
    lead_id: number | null;
    client: string;
    phone: string | null;
    treatment: string;
    specialist: string;
    branch: string;
};

export type LeadRow = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    stage: string;
    source: string;
    form: string;
    campaign: string | null;
    treatment: string | null;
    created_at: string;
};

export type Labels = Record<string, string>;

const tz = { timeZone: 'Asia/Manila' } as const;

/** "10:30" and "AM", for the agenda numerals. */
export const clock = (iso: string): [string, string] => {
    const parts = new Intl.DateTimeFormat('en-US', {
        ...tz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).formatToParts(new Date(iso));
    const get = (type: string) =>
        parts.find((p) => p.type === type)?.value ?? '';

    return [`${get('hour')}:${get('minute')}`, get('dayPeriod').toUpperCase()];
};

export const formatDate = (
    iso: string,
    options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
): string =>
    new Intl.DateTimeFormat('en-PH', { ...tz, ...options }).format(
        new Date(iso),
    );

/** "Just now", "3 hr ago", "2 days ago", then a date. */
export const ago = (iso: string): string => {
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);

    if (minutes < 1) {
        return 'Just now';
    }

    if (minutes < 60) {
        return `${minutes} min ago`;
    }

    if (minutes < 1440) {
        return `${Math.round(minutes / 60)} hr ago`;
    }

    return minutes < 2880
        ? 'Yesterday'
        : minutes < 10080
          ? `${Math.round(minutes / 1440)} days ago`
          : formatDate(iso);
};

export const sourceLabel = (source: string): string =>
    ({ walk_in: 'Walk-in', tiktok: 'TikTok' })[source] ??
    source.charAt(0).toUpperCase() + source.slice(1);

/** Status tone: where the visit is in the day, not decoration. */
export const statusTone = (status: string): string =>
    ({
        pending: 'border-gold text-gold-deep bg-background',
        confirmed: 'border-plum/30 text-plum bg-lilac/60',
        checked_in: 'border-violet bg-violet text-white',
        in_consultation: 'border-violet bg-violet text-white',
        in_treatment: 'border-violet bg-violet text-white',
        completed: 'border-border text-muted-foreground bg-muted',
        cancelled:
            'border-border text-muted-foreground line-through bg-background',
        no_show: 'border-destructive/40 text-destructive bg-background',
        rescheduled: 'border-border text-muted-foreground bg-background',
    })[status] ?? 'border-border';

export function useCan(): (permission: string) => boolean {
    const { auth } = usePage().props;

    return (permission) => auth.permissions.includes(permission);
}
