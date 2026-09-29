import { cn } from '@/lib/utils';

export type Point = { date: string; revenue: number; profit: number };

/**
 * Revenue and gross profit over the window, as inline SVG.
 *
 * Hand-drawn rather than pulled from a charting library. The library this
 * would need is a few hundred kilobytes, and it would be here to draw two
 * lines and a few bars. It also brings its own opinions about padding and
 * scaling that would then have to be fought, and the scale is the part that
 * matters: a chart that does not start at zero misleads, and a library makes
 * that easy to do by accident.
 */
export function TrendChart({
    points,
    className,
}: {
    points: Point[];
    className?: string;
}) {
    const height = 200;
    // A flat window would divide by zero. One peso is the least that can be
    // drawn without inventing a shape the data does not have.
    const peak = Math.max(
        1,
        ...points.map((p) => Math.max(p.revenue, p.profit)),
    );
    const width = 100;
    const pad = 4;

    const x = (index: number) =>
        points.length <= 1
            ? 0
            : pad + (index / (points.length - 1)) * (width - pad * 2);

    const y = (value: number) =>
        height - pad - (Math.max(0, value) / peak) * (height - pad * 2);

    const line = (pick: (p: Point) => number) =>
        points
            .map(
                (p, i) =>
                    `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(pick(p)).toFixed(2)}`,
            )
            .join(' ');

    const area = (pick: (p: Point) => number) =>
        `${line(pick)} L ${x(points.length - 1).toFixed(2)} ${height - pad} L ${x(0).toFixed(2)} ${height - pad} Z`;

    const last = points.at(-1);

    return (
        <figure className={cn('space-y-2', className)}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                className="h-[200px] w-full"
                role="img"
                aria-label={`Revenue and gross profit over ${points.length} days. Most recent day: ${Math.round(last?.revenue ?? 0)} pesos.`}
            >
                <line
                    x1={0}
                    x2={width}
                    y1={height - pad}
                    y2={height - pad}
                    stroke="currentColor"
                    strokeOpacity="0.2"
                    vectorEffect="non-scaling-stroke"
                />
                <path d={area((p) => p.revenue)} className="fill-plum/10" />
                <path
                    d={line((p) => p.revenue)}
                    fill="none"
                    className="stroke-plum"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                />
                <path
                    d={line((p) => p.profit)}
                    fill="none"
                    className="stroke-gold-deep"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>

            <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 bg-plum" aria-hidden /> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                    <span
                        className="h-0.5 w-4 border-t-2 border-dashed border-gold-deep"
                        aria-hidden
                    />
                    Gross profit
                </span>
                <span className="ml-auto">
                    {points[0]?.date} to {last?.date}
                </span>
            </figcaption>
        </figure>
    );
}

/**
 * A row of daily bars.
 *
 * Bars rather than a second line: bookings are whole small numbers, and the
 * question is which days were busy, not the shape of a curve.
 */
export function BarChart({
    points,
    height = 120,
    tone = 'plum',
    className,
}: {
    points: { date: string; value: number }[];
    height?: number;
    tone?: 'plum' | 'gold';
    className?: string;
}) {
    const peak = Math.max(1, ...points.map((p) => p.value));

    return (
        <figure className={className}>
            <svg
                viewBox={`0 0 ${Math.max(1, points.length) * 3} ${height}`}
                preserveAspectRatio="none"
                style={{ height }}
                className="w-full"
                role="img"
                aria-label={`Daily totals over ${points.length} days, busiest day ${peak}.`}
            >
                {points.map((point) => {
                    const barHeight = Math.max(
                        1,
                        (point.value / peak) * (height - 4),
                    );

                    return (
                        <rect
                            key={point.date}
                            x="0"
                            width="2.4"
                            // A zero day gets a hairline rather than nothing,
                            // so a quiet day still reads as a day.
                            height={barHeight}
                            y={height - barHeight}
                            rx="0.5"
                            className={
                                point.value > 0
                                    ? tone === 'plum'
                                        ? 'fill-plum/70'
                                        : 'fill-gold-deep/70'
                                    : 'fill-current opacity-15'
                            }
                        />
                    );
                })}
            </svg>
        </figure>
    );
}

/**
 * A share of a whole, as a ring.
 *
 * A ring over a stacked bar because the first slice is the question being
 * asked -- how much is cash -- and in a bar the reader has to measure it.
 */
export function RingChart({
    segments,
    size = 132,
    className,
}: {
    segments: { label: string; value: number; color: string }[];
    size?: number;
    className?: string;
}) {
    const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;

    const share = (value: number) =>
        total > 0 ? Math.round((Math.max(0, value) / total) * 100) : 0;

    return (
        <div className={cn('flex items-center gap-5', className)}>
            <svg
                viewBox="0 0 100 100"
                style={{ width: size, height: size }}
                className="-rotate-90"
                role="img"
                aria-label={
                    segments
                        .filter((s) => s.value > 0)
                        .map((s) => `${s.label} ${share(s.value)}%`)
                        .join(', ') || 'No payments recorded'
                }
            >
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    strokeWidth="12"
                    className="stroke-muted"
                />
                {segments.map((segment) => {
                    const length =
                        total > 0
                            ? (Math.max(0, segment.value) / total) *
                              circumference
                            : 0;

                    const ring = (
                        <circle
                            key={segment.label}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            strokeWidth="12"
                            stroke={segment.color}
                            strokeDasharray={`${length} ${circumference - length}`}
                            strokeDashoffset={-offset}
                        />
                    );

                    offset += length;

                    return ring;
                })}
            </svg>

            <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
                {segments.map((segment) => (
                    <li key={segment.label} className="flex items-center gap-2">
                        <span
                            className="size-2.5 shrink-0"
                            style={{ backgroundColor: segment.color }}
                            aria-hidden
                        />
                        <span className="truncate text-muted-foreground">
                            {segment.label}
                        </span>
                        <span className="ml-auto tabular-nums">
                            {share(segment.value)}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
