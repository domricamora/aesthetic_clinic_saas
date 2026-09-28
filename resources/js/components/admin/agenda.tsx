import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import StatusSelect from '@/components/admin/status-select';
import type { AppointmentRow, Labels } from '@/lib/admin';
import { clock, useCan } from '@/lib/admin';
import { cn } from '@/lib/utils';
import leads from '@/routes/admin/leads';

/**
 * A day of visits in time order. On today's agenda a gold hairline marks
 * the present, so reception sees at a glance who is next.
 */
export default function Agenda({
    rows,
    statuses,
    showNow = false,
    showBranch = true,
}: {
    rows: AppointmentRow[];
    statuses: Labels;
    showNow?: boolean;
    showBranch?: boolean;
}) {
    const can = useCan();
    const now = Date.now();
    const nowIndex = showNow
        ? rows.findIndex((r) => new Date(r.starts_at).getTime() > now)
        : -1;
    const [nowTime, nowPeriod] = clock(new Date(now).toISOString());

    return (
        <ol className="divide-y divide-border border-y border-border">
            {rows.map((row, i) => {
                const [time, period] = clock(row.starts_at);
                const done = [
                    'completed',
                    'cancelled',
                    'no_show',
                    'rescheduled',
                ].includes(row.status);

                return (
                    <Fragment key={row.id}>
                        {i === nowIndex && (
                            <li
                                aria-label={`Now, ${nowTime} ${nowPeriod}`}
                                className="relative h-0 border-0"
                            >
                                <span className="absolute inset-x-0 -top-px h-px bg-gold" />
                                <span className="absolute -top-2.5 left-0 bg-background pr-2 text-[11px] font-medium text-gold-deep">
                                    Now {nowTime} {nowPeriod}
                                </span>
                            </li>
                        )}
                        <li
                            className={cn(
                                'grid grid-cols-[4.75rem_1fr] items-center gap-x-4 gap-y-2 py-4 sm:grid-cols-[5.5rem_1fr_auto]',
                                done && 'opacity-60',
                            )}
                        >
                            <p className="font-display leading-none text-ink dark:text-foreground">
                                <span className="text-[1.75rem] tabular-nums">
                                    {time}
                                </span>
                                <span className="ml-1 font-sans text-[11px] text-muted-foreground">
                                    {period}
                                </span>
                            </p>
                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    {row.lead_id && can('leads.view') ? (
                                        <Link
                                            href={leads.show(row.lead_id).url}
                                            className="underline-offset-4 hover:underline"
                                        >
                                            {row.client}
                                        </Link>
                                    ) : (
                                        row.client
                                    )}
                                </p>
                                <p className="truncate text-sm text-muted-foreground">
                                    {row.treatment} with {row.specialist}
                                    {showBranch && `, ${row.branch}`}
                                </p>
                            </div>
                            <div className="col-start-2 sm:col-start-auto">
                                <StatusSelect
                                    id={row.id}
                                    status={row.status}
                                    statuses={statuses}
                                />
                            </div>
                        </li>
                    </Fragment>
                );
            })}
        </ol>
    );
}
