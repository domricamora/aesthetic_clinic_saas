import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Agenda from '@/components/admin/agenda';
import type { AppointmentRow, Labels } from '@/lib/admin';
import { formatDate } from '@/lib/admin';
import { manilaNow, toIsoDate } from '@/lib/site';
import { cn } from '@/lib/utils';
import appointments from '@/routes/admin/appointments';

type Props = {
    date: string;
    branch: number | null;
    branches: { id: number; name: string }[];
    appointments: AppointmentRow[];
    statuses: Labels;
};

const shift = (date: string, days: number): string => {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + days);

    return toIsoDate(d);
};

export default function AppointmentsIndex({
    date,
    branch,
    branches,
    appointments: rows,
    statuses,
}: Props) {
    const today = toIsoDate(manilaNow());
    const url = (day: string | undefined, branchId: number | null) =>
        appointments.index({
            query: { date: day, branch: branchId ?? undefined },
        }).url;
    const active = rows.filter(
        (r) => !['cancelled', 'rescheduled'].includes(r.status),
    ).length;
    const navButton =
        'inline-flex h-10 items-center border border-border bg-background px-3 text-sm transition-colors duration-150 ease-out hover:bg-mist dark:hover:bg-white/5';

    return (
        <>
            <Head title="Appointments" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {active} {active === 1 ? 'visit' : 'visits'}
                            {date === today && ' today'}
                        </p>
                        <h1 className="mt-1 font-display text-3xl md:text-4xl">
                            {formatDate(`${date}T12:00:00+08:00`, {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex">
                            <Link
                                href={url(shift(date, -1), branch)}
                                preserveScroll
                                className={navButton}
                                aria-label="Previous day"
                            >
                                <ChevronLeft className="size-4" />
                            </Link>
                            <Link
                                href={url(undefined, branch)}
                                preserveScroll
                                className={cn(
                                    navButton,
                                    '-ml-px',
                                    date === today &&
                                        'font-medium text-plum dark:text-lilac',
                                )}
                            >
                                Today
                            </Link>
                            <Link
                                href={url(shift(date, 1), branch)}
                                preserveScroll
                                className={cn(navButton, '-ml-px')}
                                aria-label="Next day"
                            >
                                <ChevronRight className="size-4" />
                            </Link>
                        </div>
                        <label className="sr-only" htmlFor="day">
                            Go to date
                        </label>
                        <input
                            id="day"
                            type="date"
                            value={date}
                            onChange={(e) =>
                                e.target.value &&
                                router.get(url(e.target.value, branch))
                            }
                            className="h-10 border border-border bg-background px-3 text-sm outline-none focus:border-violet"
                        />
                        <label className="sr-only" htmlFor="branch">
                            Branch
                        </label>
                        <select
                            id="branch"
                            value={branch ?? ''}
                            onChange={(e) =>
                                router.get(
                                    url(
                                        date,
                                        e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                    ),
                                )
                            }
                            className="h-10 border border-border bg-background px-3 text-sm outline-none focus:border-violet"
                        >
                            <option value="">All branches</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </header>

                {rows.length ? (
                    <Agenda
                        rows={rows}
                        statuses={statuses}
                        showNow={date === today}
                        showBranch={!branch}
                    />
                ) : (
                    <p className="border-y border-border py-10 text-muted-foreground">
                        No visits on this day{branch ? ' at this branch' : ''}.
                        Pick another date or branch above.
                    </p>
                )}
            </div>
        </>
    );
}

AppointmentsIndex.layout = {
    breadcrumbs: [{ title: 'Appointments', href: appointments.index() }],
};
