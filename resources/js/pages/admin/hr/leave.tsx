import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, useCan } from '@/lib/admin';
import type { Labels } from '@/lib/admin';
import { personTone } from '@/lib/people';
import { cn } from '@/lib/utils';
import hr from '@/routes/admin/hr';

type Row = {
    id: number;
    employee: string;
    position: string;
    type: string;
    from_date: string;
    to_date: string;
    days: number;
    reason: string | null;
    status: string;
    reviewer: string | null;
};

type Props = {
    requests: Row[];
    employees: { id: number; name: string }[];
    types: Labels;
    statuses: Labels;
    pending: number;
};

export default function HrLeave({
    requests,
    employees,
    types,
    statuses,
    pending,
}: Props) {
    const can = useCan();
    const request = useForm({
        employee_id: employees[0]?.id ?? 0,
        type: 'annual',
        from_date: new Date().toISOString().slice(0, 10),
        to_date: new Date().toISOString().slice(0, 10),
        days: '1',
        reason: '',
    });
    const review = useForm({ status: '', review_note: '' });

    const decide = (id: number, status: 'approved' | 'declined') => {
        review.setData('status', status);
        review.patch(hr.leave.review(id).url, { preserveScroll: true });
    };

    const day = (date: string) =>
        formatDate(`${date}T12:00:00+08:00`, {
            day: 'numeric',
            month: 'short',
        });

    return (
        <>
            <Head title="Time off" />
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
                            Time off
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {pending > 0
                                ? `${pending} waiting on a decision`
                                : 'Nothing waiting'}
                        </p>
                    </div>
                </header>

                {can('hr.create') && (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            request.post(hr.leave.store().url, {
                                preserveScroll: true,
                            });
                        }}
                        className="grid max-w-4xl gap-4 border border-border bg-background p-6 sm:grid-cols-6"
                    >
                        <div className="grid gap-1 sm:col-span-2">
                            <Label htmlFor="employee">For</Label>
                            <select
                                id="employee"
                                value={request.data.employee_id}
                                onChange={(e) =>
                                    request.setData(
                                        'employee_id',
                                        Number(e.target.value),
                                    )
                                }
                                className="h-10 border border-border bg-background px-2 text-sm"
                            >
                                {employees.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="type">Type</Label>
                            <select
                                id="type"
                                value={request.data.type}
                                onChange={(e) =>
                                    request.setData('type', e.target.value)
                                }
                                className="h-10 border border-border bg-background px-2 text-sm"
                            >
                                {Object.entries(types).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="from">From</Label>
                            <Input
                                id="from"
                                type="date"
                                value={request.data.from_date}
                                onChange={(e) =>
                                    request.setData('from_date', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="to">To</Label>
                            <Input
                                id="to"
                                type="date"
                                value={request.data.to_date}
                                onChange={(e) =>
                                    request.setData('to_date', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="days">Days</Label>
                            <Input
                                id="days"
                                type="number"
                                min={0.5}
                                step="0.5"
                                value={request.data.days}
                                onChange={(e) =>
                                    request.setData('days', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-1 sm:col-span-4">
                            <Label htmlFor="reason">Reason</Label>
                            <Input
                                id="reason"
                                value={request.data.reason}
                                onChange={(e) =>
                                    request.setData('reason', e.target.value)
                                }
                                placeholder="Optional"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                type="submit"
                                disabled={request.processing}
                                className="h-10 bg-plum text-white hover:bg-plum-deep"
                            >
                                {request.processing && <Spinner />}
                                File request
                            </Button>
                        </div>
                        {request.errors.to_date && (
                            <p className="text-sm text-destructive sm:col-span-6">
                                {request.errors.to_date}
                            </p>
                        )}
                    </form>
                )}

                <div className="overflow-x-auto border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="px-4 py-3 font-normal">
                                    Employee
                                </th>
                                <th className="px-4 py-3 font-normal">Type</th>
                                <th className="px-4 py-3 font-normal">Dates</th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Days
                                </th>
                                <th className="px-4 py-3 font-normal">
                                    Status
                                </th>
                                <th className="px-4 py-3 font-normal">
                                    Decide
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-border last:border-0"
                                >
                                    <td className="px-4 py-3">
                                        {row.employee}
                                        <span className="block text-xs text-muted-foreground">
                                            {row.position}
                                            {row.reason
                                                ? ` · ${row.reason}`
                                                : ''}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {types[row.type] ?? row.type}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">
                                        {day(row.from_date)} –{' '}
                                        {day(row.to_date)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {row.days}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={cn(
                                                'inline-flex border px-2 py-1 text-xs',
                                                personTone(row.status),
                                            )}
                                        >
                                            {statuses[row.status] ?? row.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {can('hr.create') &&
                                        row.status === 'pending' ? (
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        decide(
                                                            row.id,
                                                            'approved',
                                                        )
                                                    }
                                                >
                                                    <Check className="h-3 w-3" />{' '}
                                                    Approve
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        decide(
                                                            row.id,
                                                            'declined',
                                                        )
                                                    }
                                                >
                                                    <X className="h-3 w-3" />{' '}
                                                    Decline
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                {row.reviewer
                                                    ? `by ${row.reviewer}`
                                                    : '—'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
