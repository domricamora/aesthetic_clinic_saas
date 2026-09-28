import { Head, Link, usePage } from '@inertiajs/react';
import Agenda from '@/components/admin/agenda';
import type { AppointmentRow, Labels, LeadRow } from '@/lib/admin';
import { ago, formatDate, sourceLabel } from '@/lib/admin';
import { book, dashboard } from '@/routes';
import appointments from '@/routes/admin/appointments';
import leads from '@/routes/admin/leads';

type Props = {
    today: AppointmentRow[] | null;
    stats: {
        today: number | null;
        to_confirm: number | null;
        new_leads: number | null;
        leads_week: number | null;
    };
    leads: LeadRow[] | null;
    statuses: Labels;
    stages: Labels;
};

const greeting = (): string => {
    const hour = Number(
        new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Manila',
            hour: 'numeric',
            hourCycle: 'h23',
        }).format(new Date()),
    );

    return hour < 12
        ? 'Good morning'
        : hour < 18
          ? 'Good afternoon'
          : 'Good evening';
};

export default function Dashboard({
    today,
    stats,
    leads: recent,
    statuses,
    stages,
}: Props) {
    const { auth } = usePage().props;
    const figures = [
        {
            label: 'Visits today',
            value: stats.today,
            href: appointments.index().url,
        },
        {
            label: 'Waiting for confirmation',
            value: stats.to_confirm,
            href: appointments.index().url,
        },
        {
            label: 'New leads to contact',
            value: stats.new_leads,
            href: leads.index({ query: { stage: 'new' } }).url,
        },
        {
            label: 'Leads in the last 7 days',
            value: stats.leads_week,
            href: leads.index().url,
        },
    ].filter((f) => f.value !== null);

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {formatDate(new Date().toISOString(), {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </p>
                        <h1 className="mt-1 font-display text-3xl md:text-4xl">
                            {greeting()}, {auth.user.name.split(' ')[0]}
                        </h1>
                    </div>
                    <a
                        href={book().url}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-plum px-4 py-2 text-sm font-medium text-plum transition-colors duration-150 ease-out hover:bg-plum hover:text-white dark:border-lilac dark:text-lilac"
                    >
                        Open public booking page
                    </a>
                </header>

                {figures.length > 0 && (
                    <dl className="grid grid-cols-2 border-y border-border lg:grid-cols-4">
                        {figures.map((f, i) => (
                            <Link
                                key={f.label}
                                href={f.href}
                                className={`group border-border py-4 pr-4 ${i % 2 === 0 ? 'border-r' : 'pl-4'} ${i > 1 ? 'border-t lg:border-t-0' : ''} lg:border-r lg:px-5 lg:first:pl-0 lg:last:border-r-0`}
                            >
                                <dt className="text-sm text-muted-foreground group-hover:text-foreground">
                                    {f.label}
                                </dt>
                                <dd className="mt-1 font-display text-3xl tabular-nums">
                                    {f.value}
                                </dd>
                            </Link>
                        ))}
                    </dl>
                )}

                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
                    {today && (
                        <section aria-labelledby="today">
                            <div className="mb-4 flex items-baseline justify-between gap-4">
                                <h2 id="today" className="text-lg font-medium">
                                    Today
                                </h2>
                                <Link
                                    href={appointments.index().url}
                                    className="text-sm text-violet underline-offset-4 hover:underline dark:text-lilac"
                                >
                                    Day view and filters
                                </Link>
                            </div>
                            {today.length ? (
                                <Agenda
                                    rows={today}
                                    statuses={statuses}
                                    showNow
                                />
                            ) : (
                                <p className="border-y border-border py-10 text-muted-foreground">
                                    No visits booked today. New website bookings
                                    appear here the moment they are made.
                                </p>
                            )}
                        </section>
                    )}

                    {recent && (
                        <section aria-labelledby="enquiries">
                            <div className="mb-4 flex items-baseline justify-between gap-4">
                                <h2
                                    id="enquiries"
                                    className="text-lg font-medium"
                                >
                                    Latest enquiries
                                </h2>
                                <Link
                                    href={leads.index().url}
                                    className="text-sm text-violet underline-offset-4 hover:underline dark:text-lilac"
                                >
                                    All leads
                                </Link>
                            </div>
                            {recent.length ? (
                                <ul className="divide-y divide-border border-y border-border">
                                    {recent.map((lead) => (
                                        <li key={lead.id}>
                                            <Link
                                                href={leads.show(lead.id).url}
                                                className="flex items-start justify-between gap-4 py-3 transition-colors duration-150 ease-out hover:bg-mist dark:hover:bg-white/5"
                                            >
                                                <span className="min-w-0">
                                                    <span className="block truncate font-medium">
                                                        {lead.name}
                                                    </span>
                                                    <span className="block truncate text-sm text-muted-foreground">
                                                        {lead.treatment ??
                                                            'General enquiry'}
                                                        , via{' '}
                                                        {sourceLabel(
                                                            lead.source,
                                                        )}
                                                    </span>
                                                </span>
                                                <span className="shrink-0 text-right text-xs text-muted-foreground">
                                                    <span className="block">
                                                        {ago(lead.created_at)}
                                                    </span>
                                                    <span
                                                        className={
                                                            lead.stage === 'new'
                                                                ? 'mt-1 block font-medium text-gold-deep'
                                                                : 'mt-1 block'
                                                        }
                                                    >
                                                        {stages[lead.stage]}
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="border-y border-border py-10 text-muted-foreground">
                                    No enquiries yet. Website forms and bookings
                                    land here.
                                </p>
                            )}
                        </section>
                    )}
                </div>

                {!today && !recent && (
                    <p className="text-muted-foreground">
                        Your role does not include clinic screens yet. Ask an
                        administrator for access.
                    </p>
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
