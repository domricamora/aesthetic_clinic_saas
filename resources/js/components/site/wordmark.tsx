import { cn } from '@/lib/utils';

/**
 * Patrice mark: an italic Bodoni "P" inside a champagne hairline frame,
 * set beside the name and a small tracked descriptor.
 */
export default function Wordmark({ name, descriptor = 'Beauty Lounge · Aesthetics', className }: { name: string; descriptor?: string; className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-3', className)}>
            <svg viewBox="0 0 40 40" aria-hidden="true" className="size-10 shrink-0">
                <rect x="0.5" y="0.5" width="39" height="39" fill="none" stroke="var(--color-gold)" strokeWidth="1" />
                <rect x="3.5" y="3.5" width="33" height="33" fill="none" stroke="var(--color-gold)" strokeWidth="0.5" opacity="0.6" />
                <text x="20.5" y="29" textAnchor="middle" fontFamily="'Bodoni Moda', Didot, serif" fontStyle="italic" fontSize="25" fill="currentColor">
                    P
                </text>
            </svg>
            <span className="flex flex-col leading-none">
                <span className="font-display text-2xl tracking-tight">{name}</span>
                <span className="mt-1 text-[9px] tracking-[0.28em] uppercase opacity-75">{descriptor}</span>
            </span>
        </span>
    );
}
