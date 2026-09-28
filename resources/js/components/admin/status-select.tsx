import { router } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import type { Labels } from '@/lib/admin';
import { statusTone, useCan } from '@/lib/admin';
import { cn } from '@/lib/utils';
import appointments from '@/routes/admin/appointments';

/** Appointment status as a chip; staff who can edit change it in place. */
export default function StatusSelect({
    id,
    status,
    statuses,
    className,
}: {
    id: number;
    status: string;
    statuses: Labels;
    className?: string;
}) {
    const can = useCan();
    const tone = cn(
        'inline-flex h-7 items-center border px-2.5 text-xs font-medium whitespace-nowrap',
        statusTone(status),
        className,
    );

    if (!can('appointments.edit')) {
        return <span className={tone}>{statuses[status] ?? status}</span>;
    }

    return (
        <span className="relative inline-flex">
            <select
                aria-label="Appointment status"
                value={status}
                onChange={(e) =>
                    router.patch(
                        appointments.update(id).url,
                        { status: e.target.value },
                        { preserveScroll: true, preserveState: true },
                    )
                }
                className={cn(
                    tone,
                    'cursor-pointer appearance-none pr-7 transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet',
                )}
            >
                {Object.entries(statuses).map(([value, label]) => (
                    <option
                        key={value}
                        value={value}
                        className="bg-background text-foreground"
                    >
                        {label}
                    </option>
                ))}
            </select>
            <ChevronDown
                aria-hidden
                className={cn(
                    'pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2',
                    status.startsWith('in_') || status === 'checked_in'
                        ? 'text-white'
                        : 'opacity-60',
                )}
            />
        </span>
    );
}
