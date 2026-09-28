import { useEffect, useState } from 'react';
import type { Branch } from '@/types/site';

const peso = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
});

export const formatPrice = (value: number): string => peso.format(value);

export const formatDuration = (minutes: number): string =>
    minutes >= 60
        ? `${Math.floor(minutes / 60)} hr${minutes % 60 ? ` ${minutes % 60} min` : ''}`
        : `${minutes} min`;

/** "14:30" to "2:30" and "PM", for large numerals with a small meridiem. */
export const splitTime = (time: string): [string, string] => {
    const [h, m] = time.split(':').map(Number);

    return [`${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`, h < 12 ? 'AM' : 'PM'];
};

/** Current date and time in Manila, independent of the visitor timezone. */
export const manilaNow = (): Date =>
    new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));

export const toIsoDate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Next n days the clinic could be open, starting today (Manila time). */
export const upcomingDays = (n: number): Date[] => {
    const start = manilaNow();

    return Array.from({ length: n }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);

        return d;
    });
};

/** Mirrors App\Actions\Booking\AvailableSlots::hours. */
export const openWindow = (branch: Pick<Branch, 'slug'>, d: Date): [number, number] | null => {
    const day = d.getDay();

    if (day === 0) {
        return null;
    }

    const close = branch.slug === 'cebu' ? 19 : day === 6 ? 18 : 20;

    return [10, close];
};

export const isOpenNow = (branch: Pick<Branch, 'slug'>): boolean => {
    const now = manilaNow();
    const window = openWindow(branch, now);
    const hour = now.getHours() + now.getMinutes() / 60;

    return window !== null && hour >= window[0] && hour < window[1];
};

/** The appointment card follows the visitor between pages until they book. */
export type CardDraft = { treatment?: number; branch?: number; date?: string };

const KEY = 'veloura-card';

export function useCardDraft(): [CardDraft, (patch: CardDraft) => void] {
    const [draft, setDraft] = useState<CardDraft>({});

    useEffect(() => {
        try {
            setDraft(JSON.parse(localStorage.getItem(KEY) ?? '{}') as CardDraft);
        } catch {
            // Private mode or blocked storage: the card simply starts empty.
        }
    }, []);

    const update = (patch: CardDraft) =>
        setDraft((current) => {
            const next = { ...current, ...patch };

            try {
                localStorage.setItem(KEY, JSON.stringify(next));
            } catch {
                // Not critical; the card still works for this page.
            }

            return next;
        });

    return [draft, update];
}

/** Adds .is-in to [data-reveal] elements as they scroll into view. */
export function useReveal(): void {
    useEffect(() => {
        const root = document.documentElement;
        const items = document.querySelectorAll<HTMLElement>('[data-reveal]');

        if (!('IntersectionObserver' in window) || items.length === 0) {
            return;
        }

        root.classList.add('reveal-ready');
        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-in');
                        observer.unobserve(entry.target);
                    }
                }),
            { rootMargin: '0px 0px -8% 0px' },
        );
        items.forEach((item) => observer.observe(item));

        return () => {
            observer.disconnect();
            root.classList.remove('reveal-ready');
        };
    }, []);
}
