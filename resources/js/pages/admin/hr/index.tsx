import { Head, Link, router, useForm } from '@inertiajs/react';
import { CalendarClock, Search, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, useCan } from '@/lib/admin';
import type { Labels } from '@/lib/admin';
import type { EmployeeRow } from '@/lib/people';
import { personTone } from '@/lib/people';
import { money } from '@/lib/pos';
import { cn } from '@/lib/utils';
import hr from '@/routes/admin/hr';

type Props = {
    employees: EmployeeRow[];
    branches: { id: number; name: string }[];
    departments: string[];
    query: string;
    department: string;
    branch: number | null;
    status: string | null;
    kind: string;
    types: Labels;
    statuses: Labels;
    headcount: number;
    doctors: number;
    payroll: number;
};

export default function HrIndex({
    employees,
    branches,
    departments,
    query,
    department,
    branch,
    status,
    kind,
    types,
    statuses,
    headcount,
    doctors,
    payroll,
}: Props) {
    const can = useCan();
    const [search, setSearch] = useState(query);
    const [adding, setAdding] = useState(false);

    const form = useForm({
        name: '',
        employee_no: '',
        position: '',
        department: 'Clinic',
        branch_id: branches[0]?.id ?? '',
        hire_date: new Date().toISOString().slice(0, 10),
        employment_type: 'regular',
        pay_schedule: 'monthly',
        base_salary: '',
        monthly_allowance: '',
        phone: '',
    });

    const url = (extra: Record<string, string | number | undefined>) =>
        hr.index({
            query: {
                q: search || undefined,
                department: department || undefined,
                branch: branch ?? undefined,
                status: status ?? undefined,
                kind: kind === 'all' ? undefined : kind,
                ...extra,
            },
        }).url;

    const stat = (label: string, value: string, note?: string) => (
        <div className="border border-border bg-background px-4 py-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-2xl tabular-nums">{value}</p>
            {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
    );

    return (
        <>
            <Head title="Staff" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {employees.length} on the roll
                        </p>
                        <h1 className="mt-1 font-display text-3xl md:text-4xl">
                            Staff
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={hr.leave().url}
                            className="press inline-flex h-10 items-center gap-2 border border-border bg-background px-4 text-sm hover:bg-mist dark:hover:bg-white/5"
                        >
                            <CalendarClock className="h-4 w-4" />
                            Time off
                        </Link>
                        <Link
                            href={hr.attendance().url}
                            className="press inline-flex h-10 items-center gap-2 border border-border bg-background px-4 text-sm hover:bg-mist dark:hover:bg-white/5"
                        >
                            <Users className="h-4 w-4" />
                            Who is in
                        </Link>
                        {can('hr.create') && (
                            <Button
                                type="button"
                                onClick={() => setAdding((open) => !open)}
                                className="h-10 bg-plum text-white hover:bg-plum-deep"
                            >
                                <UserPlus className="h-4 w-4" />
                                Add employee
                            </Button>
                        )}
                    </div>
                </header>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {stat('Headcount', String(headcount))}
                    {stat('Monthly payroll', money(payroll))}
                    {stat(
                        'Doctors and clinicians',
                        String(doctors),
                        'can treat clients',
                    )}
                    {stat('Departments', String(departments.length))}
                </div>

                {adding && (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(hr.store().url, {
                                preserveScroll: true,
                                onSuccess: () => setAdding(false),
                            });
                        }}
                        className="grid max-w-3xl gap-4 border border-border bg-background p-6"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-1">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    required
                                />
                                {form.errors.name && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="employee_no">Employee no</Label>
                                <Input
                                    id="employee_no"
                                    value={form.data.employee_no}
                                    onChange={(e) =>
                                        form.setData(
                                            'employee_no',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="EMP-0008"
                                    required
                                />
                                {form.errors.employee_no && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.employee_no}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-1">
                                <Label htmlFor="position">Position</Label>
                                <Input
                                    id="position"
                                    value={form.data.position}
                                    onChange={(e) =>
                                        form.setData('position', e.target.value)
                                    }
                                    placeholder="Aesthetician"
                                    required
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    value={form.data.department}
                                    onChange={(e) =>
                                        form.setData(
                                            'department',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-4">
                            <div className="grid gap-1">
                                <Label htmlFor="branch">Branch</Label>
                                <select
                                    id="branch"
                                    value={form.data.branch_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'branch_id',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="h-10 border border-border bg-background px-2 text-sm"
                                >
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="hire_date">Hired</Label>
                                <Input
                                    id="hire_date"
                                    type="date"
                                    value={form.data.hire_date}
                                    onChange={(e) =>
                                        form.setData(
                                            'hire_date',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="employment_type">Type</Label>
                                <select
                                    id="employment_type"
                                    value={form.data.employment_type}
                                    onChange={(e) =>
                                        form.setData(
                                            'employment_type',
                                            e.target.value,
                                        )
                                    }
                                    className="h-10 border border-border bg-background px-2 text-sm"
                                >
                                    {Object.entries(types).map(
                                        ([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="pay_schedule">Paid</Label>
                                <select
                                    id="pay_schedule"
                                    value={form.data.pay_schedule}
                                    onChange={(e) =>
                                        form.setData(
                                            'pay_schedule',
                                            e.target.value,
                                        )
                                    }
                                    className="h-10 border border-border bg-background px-2 text-sm"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="semi_monthly">
                                        Semi-monthly
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="grid gap-1">
                                <Label htmlFor="base_salary">
                                    Monthly salary
                                </Label>
                                <Input
                                    id="base_salary"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={form.data.base_salary}
                                    onChange={(e) =>
                                        form.setData(
                                            'base_salary',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {form.errors.base_salary && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.base_salary}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="monthly_allowance">
                                    Allowance
                                </Label>
                                <Input
                                    id="monthly_allowance"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={form.data.monthly_allowance}
                                    onChange={(e) =>
                                        form.setData(
                                            'monthly_allowance',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="h-10 bg-plum text-white hover:bg-plum-deep"
                            >
                                {form.processing && <Spinner />}
                                Save
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAdding(false)}
                                className="h-10"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            router.get(url({}), { preserveScroll: true });
                        }}
                        className="relative flex-1"
                    >
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search the staff roll"
                            aria-label="Search the staff roll"
                            className="h-10 pl-9"
                        />
                    </form>
                    <select
                        value={department}
                        onChange={(e) =>
                            router.get(
                                url({
                                    department: e.target.value || undefined,
                                }),
                                { preserveScroll: true },
                            )
                        }
                        aria-label="Department"
                        className="h-10 border border-border bg-background px-3 text-sm"
                    >
                        <option value="">All departments</option>
                        {departments.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                    <select
                        value={kind}
                        onChange={(e) =>
                            router.get(url({ kind: e.target.value }), {
                                preserveScroll: true,
                            })
                        }
                        aria-label="Kind of staff"
                        className="h-10 border border-border bg-background px-3 text-sm"
                    >
                        <option value="all">Everyone</option>
                        <option value="doctors">Doctors and clinicians</option>
                        <option value="admin">Office and front desk</option>
                    </select>
                    <select
                        value={branch ?? ''}
                        onChange={(e) =>
                            router.get(
                                url({
                                    branch: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                }),
                                { preserveScroll: true },
                            )
                        }
                        aria-label="Branch"
                        className="h-10 border border-border bg-background px-3 text-sm"
                    >
                        <option value="">All branches</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="px-4 py-3 font-normal">Name</th>
                                <th className="px-4 py-3 font-normal">
                                    Position
                                </th>
                                <th className="px-4 py-3 font-normal">
                                    Branch
                                </th>
                                <th className="px-4 py-3 font-normal">Hired</th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Monthly
                                </th>
                                <th className="px-4 py-3 font-normal">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((person) => (
                                <tr
                                    key={person.id}
                                    className="border-b border-border last:border-0"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={hr.show(person.id).url}
                                            className="underline underline-offset-4 hover:text-plum"
                                        >
                                            {person.name}
                                        </Link>
                                        <span className="block text-xs text-muted-foreground">
                                            {person.employee_no} ·{' '}
                                            {types[person.employment_type] ??
                                                person.employment_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {person.position}
                                        <span className="block text-xs text-muted-foreground">
                                            {person.department}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {person.branch ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                                        {formatDate(
                                            `${person.hire_date}T12:00:00+08:00`,
                                            {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            },
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {money(person.base_salary)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={cn(
                                                'inline-flex border px-2 py-1 text-xs',
                                                personTone(person.status),
                                            )}
                                        >
                                            {statuses[person.status] ??
                                                person.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {employees.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        Nobody matches those filters.
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
