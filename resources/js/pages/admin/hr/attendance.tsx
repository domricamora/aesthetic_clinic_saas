import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useCan } from '@/lib/admin';
import { manilaNow, toIsoDate } from '@/lib/site';
import { cn } from '@/lib/utils';
import hr from '@/routes/admin/hr';

type Row = {
    name: string;
    position: string;
    time_in: string | null;
    time_out: string | null;
    hours: number;
    overtime_minutes: number;
    complete: boolean;
};

type Props = {
    date: string;
    me: { id: number; name: string } | null;
    today: {
        time_in: string | null;
        time_out: string | null;
        minutes: number;
        overtime_minutes: number;
    } | null;
    rows: Row[];
    open_shifts: number;
};

export default function HrAttendance({
    date,
    me,
    today,
    rows,
    open_shifts,
}: Props) {
    const can = useCan();
    const form = useForm({ date });
    const today8 = toIsoDate(manilaNow());
    const inWorking = Boolean(today?.time_in) && !today?.time_out;

    return (
        <>
            <Head title="Who is in" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Link
                            href={hr.index().url}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Staff
                        </Link>
                        <h1 className="mt-2 font-display text-3xl md:text-4xl">
                            Who is in
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {date === today8 ? 'Today' : date} · {rows.length}{' '}
                            clocked in
                            {open_shifts > 0 &&
                                ` · ${open_shifts} still clocked in`}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            type="date"
                            value={date}
                            max={today8}
                            onChange={(e) =>
                                router.get(
                                    hr.attendance({
                                        query: { date: e.target.value },
                                    }).url,
                                    { preserveScroll: true },
                                )
                            }
                            aria-label="Date"
                            className="h-10"
                        />
                        {me && can('hr.create') && (
                            <Button
                                type="button"
                                disabled={form.processing}
                                onClick={() =>
                                    form.post(hr.clock().url, {
                                        preserveScroll: true,
                                    })
                                }
                                className={cn(
                                    'h-10 text-white',
                                    inWorking
                                        ? 'bg-destructive hover:bg-destructive/90'
                                        : 'bg-plum hover:bg-plum-deep',
                                )}
                            >
                                {form.processing && <Spinner />}
                                {inWorking ? (
                                    <LogOut className="h-4 w-4" />
                                ) : (
                                    <LogIn className="h-4 w-4" />
                                )}
                                {inWorking
                                    ? `Clock out${
                                          today?.time_in
                                              ? ` (in ${today.time_in})`
                                              : ''
                                      }`
                                    : 'Clock in'}
                            </Button>
                        )}
                    </div>
                </header>

                {!me && (
                    <p className="border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                        You are not on the staff roll yet, so there is nothing
                        to clock. An HR manager can add you.
                    </p>
                )}

                <div className="overflow-x-auto border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="px-4 py-3 font-normal">Name</th>
                                <th className="px-4 py-3 font-normal">In</th>
                                <th className="px-4 py-3 font-normal">Out</th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Hours
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Overtime
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.name}
                                    className="border-b border-border last:border-0"
                                >
                                    <td className="px-4 py-3">
                                        {row.name}
                                        <span className="block text-xs text-muted-foreground">
                                            {row.position}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">
                                        {row.time_in ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">
                                        {row.time_out ?? (
                                            <span className="text-gold-deep">
                                                still in
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {row.hours > 0
                                            ? row.hours.toFixed(1)
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {row.overtime_minutes > 0
                                            ? `${Math.round(row.overtime_minutes / 60)} h`
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        Nobody has clocked in on this day.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
