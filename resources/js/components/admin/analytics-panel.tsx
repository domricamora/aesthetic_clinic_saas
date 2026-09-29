import { Link } from '@inertiajs/react';
import { BarChart, RingChart, TrendChart } from '@/components/admin/charts';
import { money } from '@/lib/pos';
import { dashboard } from '@/routes';

export type Analytics = {
    window: { days: number; from: string; to: string };
    daily: {
        date: string;
        revenue: number;
        profit: number;
        bookings: number;
        completed: number;
        no_show: number;
        leads: number;
    }[];
    bookings: { status: string; label: string; count: number }[];
    front_desk: {
        leads: number;
        won: number;
        conversion: number | null;
        conversations: number;
        open_conversations: number;
    };
    money: {
        revenue: number;
        profit: number;
        previous_revenue: number;
        previous_profit: number;
        refunds: number;
        discounts: number;
        cost_of_goods: number;
        sales: number;
        average_sale: number;
    } | null;
    top_treatments: { name: string; sold: number; revenue: number }[] | null;
    payment_mix:
        | {
              method: string;
              label: string;
              amount: number;
              count: number;
          }[]
        | null;
};

const SLICES = [
    '#4A1D3F',
    '#A67C00',
    '#7A5C7E',
    '#3F6B5C',
    '#B08968',
    '#5C5C5C',
];

const WINDOWS = [7, 30, 90];

/**
 * Change against the previous period, or null when there is nothing to compare.
 *
 * Growing from nothing to something is not an infinite percentage, and
 * printing one would dress an absence of data up as a result.
 */
const change = (current: number, previous: number): string | null => {
    if (previous === 0) return null;

    const percent = ((current - previous) / Math.abs(previous)) * 100;
    return `${percent > 0 ? '+' : ''}${percent.toFixed(0)}%`;
};

function Figure({
    label,
    value,
    current,
    previous,
}: {
    label: string;
    value: string;
    current?: number;
    previous?: number;
}) {
    const delta =
        current === undefined || previous === undefined
            ? null
            : change(current, previous);

    return (
        <div className="bg-background px-4 py-3">
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                {label}
            </dt>
            <dd className="mt-1 font-display text-2xl tabular-nums">{value}</dd>
            {delta && (
                <p
                    className={`mt-0.5 text-xs tabular-nums ${
                        delta.startsWith('+')
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-muted-foreground'
                    }`}
                >
                    {delta} on the period before
                </p>
            )}
        </div>
    );
}

function Panel({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div>
                <h2 className="font-display text-xl">{title}</h2>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </section>
    );
}

export default function AnalyticsPanel({
    analytics,
}: {
    analytics: Analytics;
}) {
    const { window, daily, money: cash, bookings, front_desk } = analytics;

    const totalBookings = bookings.reduce((sum, row) => sum + row.count, 0);
    const noShows = bookings
        .filter((row) => row.status === 'no_show')
        .reduce((sum, row) => sum + row.count, 0);

    return (
        <div className="space-y-8">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-display text-xl">
                        How the clinic is doing
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {window.from} to {window.to}
                    </p>
                </div>

                {/* A plain reload, not a router visit: the whole panel is one
                    query and Inertia would swap the page underneath to do it. */}
                <div
                    className="flex gap-px border border-border bg-border"
                    role="group"
                    aria-label="Reporting period"
                >
                    {WINDOWS.map((days) => (
                        <Link
                            key={days}
                            href={dashboard({ query: { days } }).url}
                            preserveScroll
                            aria-current={
                                window.days === days ? 'true' : undefined
                            }
                            className={`px-3 py-1.5 text-sm transition-colors duration-150 ease-out ${
                                window.days === days
                                    ? 'bg-plum text-white'
                                    : 'bg-background hover:bg-mist dark:hover:bg-white/5'
                            }`}
                        >
                            {days} days
                        </Link>
                    ))}
                </div>
            </header>

            {cash && (
                <Panel title="Takings">
                    <dl className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
                        <Figure
                            label="Revenue"
                            value={money(cash.revenue)}
                            current={cash.revenue}
                            previous={cash.previous_revenue}
                        />
                        <Figure
                            label="Gross profit"
                            value={money(cash.profit)}
                            current={cash.profit}
                            previous={cash.previous_profit}
                        />
                        <Figure
                            label="Average sale"
                            value={money(cash.average_sale)}
                        />
                        <Figure label="Refunded" value={money(cash.refunds)} />
                    </dl>

                    <TrendChart
                        points={daily.map((day) => ({
                            date: day.date,
                            revenue: day.revenue,
                            profit: day.profit,
                        }))}
                    />

                    <p className="text-xs text-muted-foreground">
                        Gross profit is takings less what the goods sold cost.
                        It is before wages, rent and running costs, so it is not
                        what the clinic keeps. Treatments are counted at full
                        price because no cost of goods is recorded against them,
                        which flatters the margin here.
                    </p>
                </Panel>
            )}

            <div className="grid gap-8 lg:grid-cols-2">
                <Panel
                    title="Bookings"
                    description={
                        totalBookings > 0
                            ? `${totalBookings} visits, ${noShows} no-shows.`
                            : 'Nothing booked in this period.'
                    }
                >
                    <BarChart
                        points={daily.map((day) => ({
                            date: day.date,
                            value: day.bookings,
                        }))}
                    />

                    <ul className="space-y-1.5 border-t border-border pt-3 text-sm">
                        {bookings.length === 0 && (
                            <li className="text-muted-foreground">
                                No visits in this period.
                            </li>
                        )}
                        {bookings.map((row) => (
                            <li key={row.status} className="flex gap-2">
                                <span className="text-muted-foreground">
                                    {row.label}
                                </span>
                                <span className="ml-auto tabular-nums">
                                    {row.count}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Panel>

                <Panel
                    title="Enquiries"
                    description="What the website brought in, and how far it got."
                >
                    <dl className="grid grid-cols-2 gap-px border border-border bg-border">
                        <Figure
                            label="New enquiries"
                            value={String(front_desk.leads)}
                        />
                        <Figure
                            label="Became customers"
                            value={String(front_desk.won)}
                        />
                        <Figure
                            label="Chat conversations"
                            value={String(front_desk.conversations)}
                        />
                        <Figure
                            label="Still open"
                            value={String(front_desk.open_conversations)}
                        />
                    </dl>

                    <BarChart
                        tone="gold"
                        height={80}
                        points={daily.map((day) => ({
                            date: day.date,
                            value: day.leads,
                        }))}
                    />

                    <p className="text-xs text-muted-foreground">
                        {front_desk.conversion === null
                            ? 'No enquiries came in, so there is no conversion rate to report.'
                            : `${Math.round(front_desk.conversion * 100)}% of enquiries became customers.`}
                    </p>
                </Panel>
            </div>

            {analytics.payment_mix && (
                <Panel
                    title="How they paid"
                    description="Refunds are counted against the method they came back through."
                >
                    {analytics.payment_mix.length > 0 ? (
                        <RingChart
                            segments={analytics.payment_mix.map(
                                (row, index) => ({
                                    label: row.label,
                                    value: row.amount,
                                    color: SLICES[index % SLICES.length],
                                }),
                            )}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No payments recorded in this period.
                        </p>
                    )}
                </Panel>
            )}

            {analytics.top_treatments &&
                analytics.top_treatments.length > 0 && (
                    <Panel title="Best sellers">
                        <ul className="divide-y divide-border border-y border-border">
                            {analytics.top_treatments.map((row) => {
                                const top = analytics.top_treatments?.[0];
                                const share =
                                    top && top.revenue > 0
                                        ? (row.revenue / top.revenue) * 100
                                        : 0;

                                return (
                                    <li key={row.name} className="py-2.5">
                                        <div className="flex items-baseline gap-3 text-sm">
                                            <span className="truncate">
                                                {row.name}
                                            </span>
                                            <span className="ml-auto text-muted-foreground tabular-nums">
                                                {row.sold} sold
                                            </span>
                                            <span className="w-24 text-right tabular-nums">
                                                {money(row.revenue)}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 h-1 bg-mist dark:bg-white/10">
                                            <div
                                                className="h-1 bg-plum"
                                                style={{ width: `${share}%` }}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </Panel>
                )}
        </div>
    );
}
