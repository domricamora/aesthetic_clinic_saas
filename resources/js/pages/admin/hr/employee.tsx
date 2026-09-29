import { Head, Link, useForm } from '@inertiajs/react';
import { Camera, Pencil, Trash2, UserMinus, UserPlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useCan } from '@/lib/admin';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/admin';
import type { Labels } from '@/lib/admin';
import { personTone } from '@/lib/people';
import { money } from '@/lib/pos';
import { cn } from '@/lib/utils';
import hr from '@/routes/admin/hr';
import payroll from '@/routes/admin/payroll';

type Props = {
    employee: {
        id: number;
        name: string;
        employee_no: string;
        position: string;
        department: string;
        branch: string | null;
        phone: string | null;
        hire_date: string;
        employment_type: string;
        pay_schedule: string;
        base_salary: number;
        monthly_allowance: number;
        sss_rate: number | null;
        philhealth_rate: number | null;
        pagibig_rate: number | null;
        withholding_rate: number | null;
        tax_exempt: boolean;
        branch_id: number | null;
        status: string;
        notes: string | null;
        practitioner: boolean;
        credentials: string | null;
        focus: string | null;
        photo: string | null;
        show_on_site: boolean;
        daily_rate: number;
        hourly_rate: number;
    };
    types: Labels;
    statuses: Labels;
    schedules: Labels;
    attendance: {
        work_date: string;
        time_in: string | null;
        time_out: string | null;
        hours: number;
        overtime_minutes: number;
        complete: boolean;
    }[];
    month_hours: number;
    month_overtime_hours: number;
    leaves: {
        id: number;
        type: string;
        from_date: string;
        to_date: string;
        days: number;
        reason: string | null;
        status: string;
    }[];
    leave_days_taken: number;
    adjustments: {
        id: number;
        label: string;
        kind: string;
        amount: number;
        period: string | null;
        is_active: boolean;
        note: string | null;
    }[];
    adjustment_kinds: Record<string, string>;
    payslips: {
        id: number;
        label: string | null;
        period: string | null;
        gross: number;
        net: number;
        status: string | null;
    }[];
};

const day = (date: string) =>
    formatDate(`${date}T12:00:00+08:00`, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

export default function HrEmployee(props: Props) {
    const { employee } = props;
    const can = useCan();
    const [editing, setEditing] = useState(false);
    const form = useForm({
        name: employee.name,
        employee_no: employee.employee_no,
        position: employee.position,
        department: employee.department,
        hire_date: employee.hire_date,
        employment_type: employee.employment_type,
        pay_schedule: employee.pay_schedule,
        base_salary: String(employee.base_salary),
        monthly_allowance: String(employee.monthly_allowance),
        sss_rate: employee.sss_rate === null ? '' : String(employee.sss_rate),
        philhealth_rate:
            employee.philhealth_rate === null
                ? ''
                : String(employee.philhealth_rate),
        pagibig_rate:
            employee.pagibig_rate === null ? '' : String(employee.pagibig_rate),
        withholding_rate:
            employee.withholding_rate === null
                ? ''
                : String(employee.withholding_rate),
        tax_exempt: employee.tax_exempt ? 1 : 0,
        practitioner: employee.practitioner ? 1 : 0,
        show_on_site: employee.show_on_site ? 1 : 0,
        credentials: employee.credentials ?? '',
        focus: employee.focus ?? '',
        phone: employee.phone ?? '',
        branch_id: employee.branch_id ?? '',
    });
    const action = useForm({});
    const [addingDeduction, setAddingDeduction] = useState(false);
    const deduction = useForm({
        employee_id: String(employee.id),
        label: '',
        kind: 'loan',
        amount: '',
        period: '',
        note: '',
    });
    const upload = useRef<HTMLInputElement>(null);
    const [photo, setPhoto] = useState(employee.photo);
    const [uploading, setUploading] = useState(false);
    const [photoError, setPhotoError] = useState('');

    const send = (file: File) => {
        const body = new FormData();
        body.append('photo', file);
        setUploading(true);
        setPhotoError('');
        fetch(hr.photo(employee.id).url, {
            method: 'POST',
            body,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN':
                    (
                        document.querySelector(
                            'meta[name=csrf-token]',
                        ) as HTMLMetaElement
                    )?.content ?? '',
            },
        })
            .then(async (response) => {
                const payload = await response.json();
                if (!response.ok) {
                    setPhotoError(
                        payload.message ?? 'That photo did not upload.',
                    );
                } else {
                    setPhoto(payload.url);
                }
            })
            .catch(() => setPhotoError('That photo did not upload.'))
            .finally(() => setUploading(false));
    };

    const clearPhoto = () => {
        setUploading(true);
        fetch(hr.photo.destroy(employee.id).url, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN':
                    (
                        document.querySelector(
                            'meta[name=csrf-token]',
                        ) as HTMLMetaElement
                    )?.content ?? '',
            },
        })
            .then(() => setPhoto(null))
            .catch(() => setPhotoError('That photo did not remove.'))
            .finally(() => setUploading(false));
    };
    const stat = (label: string, value: string) => (
        <div className="border border-border bg-background px-4 py-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-2xl tabular-nums">{value}</p>
        </div>
    );

    return (
        <>
            <Head title={employee.name} />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header>
                    <Link
                        href={hr.index().url}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Staff
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-3xl md:text-4xl">
                            {employee.name}
                        </h1>
                        <span
                            className={cn(
                                'inline-flex border px-2 py-1 text-xs',
                                personTone(employee.status),
                            )}
                        >
                            {props.statuses[employee.status] ?? employee.status}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {employee.position} · {employee.department} ·{' '}
                        {employee.branch ?? 'No branch'} ·{' '}
                        {employee.employee_no}
                    </p>
                </header>

                {can('hr.create') && (
                    <div className="flex flex-wrap items-center gap-2">
                        {editing ? (
                            <Button
                                type="button"
                                onClick={() => setEditing(false)}
                                variant="outline"
                                className="h-10"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={() => setEditing(true)}
                                className="h-10 bg-plum text-white hover:bg-plum-deep"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit record
                            </Button>
                        )}

                        {employee.status === 'resigned' ? (
                            <Button
                                type="button"
                                disabled={action.processing}
                                onClick={() =>
                                    action.post(hr.reinstate(employee.id).url, {
                                        preserveScroll: true,
                                    })
                                }
                                variant="outline"
                                className="h-10"
                            >
                                <UserPlus className="h-4 w-4" />
                                Put back on the roll
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                disabled={action.processing}
                                onClick={() =>
                                    action.post(hr.resign(employee.id).url, {
                                        preserveScroll: true,
                                    })
                                }
                                variant="outline"
                                className="h-10 text-destructive"
                            >
                                <UserMinus className="h-4 w-4" />
                                Stand down
                            </Button>
                        )}
                    </div>
                )}

                {editing && (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.patch(hr.update(employee.id).url, {
                                preserveScroll: true,
                                onSuccess: () => setEditing(false),
                            });
                        }}
                        className="grid gap-4 border border-border bg-background p-6 sm:grid-cols-3"
                    >
                        <div className="grid gap-1 sm:col-span-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
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
                            <Label htmlFor="edit-no">Employee no</Label>
                            <Input
                                id="edit-no"
                                value={form.data.employee_no}
                                onChange={(e) =>
                                    form.setData('employee_no', e.target.value)
                                }
                                required
                            />
                            {form.errors.employee_no && (
                                <p className="text-sm text-destructive">
                                    {form.errors.employee_no}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="edit-position">Position</Label>
                            <Input
                                id="edit-position"
                                value={form.data.position}
                                onChange={(e) =>
                                    form.setData('position', e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="edit-department">Department</Label>
                            <Input
                                id="edit-department"
                                value={form.data.department}
                                onChange={(e) =>
                                    form.setData('department', e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="edit-hired">Hired</Label>
                            <Input
                                id="edit-hired"
                                type="date"
                                value={form.data.hire_date}
                                onChange={(e) =>
                                    form.setData('hire_date', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="edit-type">Employment</Label>
                            <select
                                id="edit-type"
                                value={form.data.employment_type}
                                onChange={(e) =>
                                    form.setData(
                                        'employment_type',
                                        e.target.value,
                                    )
                                }
                                className="h-10 border border-border bg-background px-2 text-sm"
                            >
                                {Object.entries(props.types).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="edit-paid">Paid</Label>
                            <select
                                id="edit-paid"
                                value={form.data.pay_schedule}
                                onChange={(e) =>
                                    form.setData('pay_schedule', e.target.value)
                                }
                                className="h-10 border border-border bg-background px-2 text-sm"
                            >
                                {Object.entries(props.schedules).map(
                                    ([k, v]) => (
                                        <option key={k} value={k}>
                                            {v}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="edit-salary">Monthly salary</Label>
                            <Input
                                id="edit-salary"
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.data.base_salary}
                                onChange={(e) =>
                                    form.setData('base_salary', e.target.value)
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
                            <Label htmlFor="edit-allowance">Allowance</Label>
                            <Input
                                id="edit-allowance"
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
                            <Label htmlFor="edit-phone">Phone</Label>
                            <Input
                                id="edit-phone"
                                value={form.data.phone}
                                onChange={(e) =>
                                    form.setData('phone', e.target.value)
                                }
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <p className="border-t border-border pt-4 text-sm font-medium">
                                Statutory rates
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Leave a box empty to use the clinic rate from
                                Payroll settings. Set one only where that rate
                                is wrong for this person.
                            </p>
                        </div>

                        {(
                            [
                                ['sss_rate', 'SSS', 'edit-sss'],
                                [
                                    'philhealth_rate',
                                    'PhilHealth',
                                    'edit-philhealth',
                                ],
                                ['pagibig_rate', 'Pag-IBIG', 'edit-pagibig'],
                            ] as const
                        ).map(([key, label, id]) => (
                            <div key={key} className="grid gap-1">
                                <Label htmlFor={id}>{label} rate</Label>
                                <Input
                                    id={id}
                                    type="number"
                                    min={0}
                                    max={1}
                                    step="0.0001"
                                    placeholder="Clinic rate"
                                    value={form.data[key]}
                                    onChange={(e) =>
                                        form.setData(key, e.target.value)
                                    }
                                />
                                {form.errors[key] && (
                                    <p className="text-sm text-destructive">
                                        {form.errors[key]}
                                    </p>
                                )}
                            </div>
                        ))}

                        <div className="grid gap-1">
                            <Label htmlFor="edit-withholding">
                                Withholding rate
                            </Label>
                            <Input
                                id="edit-withholding"
                                type="number"
                                min={0}
                                max={1}
                                step="0.0001"
                                placeholder="BIR table"
                                value={form.data.withholding_rate}
                                onChange={(e) =>
                                    form.setData(
                                        'withholding_rate',
                                        e.target.value,
                                    )
                                }
                            />
                            {form.errors.withholding_rate && (
                                <p className="text-sm text-destructive">
                                    {form.errors.withholding_rate}
                                </p>
                            )}
                        </div>

                        <div className="sm:col-span-3">
                            <label className="flex items-start gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="mt-0.5"
                                    checked={form.data.tax_exempt === 1}
                                    onChange={(e) =>
                                        form.setData(
                                            'tax_exempt',
                                            e.target.checked ? 1 : 0,
                                        )
                                    }
                                />
                                <span>
                                    Exempt from withholding tax
                                    <span className="mt-1 block text-xs text-muted-foreground">
                                        For someone exempt under a TRAIN
                                        provision. This wins over any rate
                                        above, and is a better record than a
                                        rate of zero.
                                    </span>
                                </span>
                            </label>
                        </div>

                        <div className="sm:col-span-3">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.data.practitioner === 1}
                                    onChange={(e) =>
                                        form.setData(
                                            'practitioner',
                                            e.target.checked ? 1 : 0,
                                        )
                                    }
                                />
                                Treats clients (doctor, nurse or therapist)
                            </label>
                        </div>

                        {form.data.practitioner === 1 && (
                            <>
                                <div className="grid gap-1 sm:col-span-2">
                                    <Label htmlFor="edit-credentials">
                                        Credentials
                                    </Label>
                                    <Input
                                        id="edit-credentials"
                                        value={form.data.credentials}
                                        onChange={(e) =>
                                            form.setData(
                                                'credentials',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="MD, Lic. 12345"
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="edit-focus">Focus</Label>
                                    <Input
                                        id="edit-focus"
                                        value={form.data.focus}
                                        onChange={(e) =>
                                            form.setData(
                                                'focus',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Injectables"
                                    />
                                </div>
                            </>
                        )}

                        <div className="sm:col-span-3">
                            <Label>Photo</Label>
                            <div className="mt-1 flex flex-wrap items-center gap-4">
                                <div className="h-28 w-24 shrink-0 overflow-hidden border border-border bg-mist">
                                    {photo ? (
                                        <img
                                            src={photo}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                            <Camera className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-start gap-2">
                                    <input
                                        ref={upload}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={(event) => {
                                            const file =
                                                event.target.files?.[0];
                                            if (file) send(file);
                                            event.target.value = '';
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={uploading}
                                        onClick={() => upload.current?.click()}
                                        className="h-9"
                                    >
                                        {uploading ? (
                                            <Spinner />
                                        ) : (
                                            <Camera className="h-4 w-4" />
                                        )}
                                        {photo ? 'Replace' : 'Upload a photo'}
                                    </Button>
                                    {photo && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            disabled={uploading}
                                            onClick={clearPhoto}
                                            className="h-9 justify-start"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Remove
                                        </Button>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        JPG, PNG or WebP, up to 4MB.
                                    </p>
                                    {photoError && (
                                        <p className="text-sm text-destructive">
                                            {photoError}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label className="flex items-start gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={form.data.show_on_site === 1}
                                    onChange={(e) =>
                                        form.setData(
                                            'show_on_site',
                                            e.target.checked ? 1 : 0,
                                        )
                                    }
                                />
                                <span>
                                    Show on the website
                                    <span className="block text-xs text-muted-foreground">
                                        Appears under "Who looks after you" on
                                        the about page. Off by default: working
                                        here is not the same as agreeing to be
                                        advertised.
                                    </span>
                                </span>
                            </label>
                        </div>
                        <div className="sm:col-span-3">
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="h-10 bg-plum text-white hover:bg-plum-deep"
                            >
                                {form.processing && <Spinner />}
                                Save
                            </Button>
                        </div>
                    </form>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {stat('Monthly salary', money(employee.base_salary))}
                    {stat('Hours this month', props.month_hours.toFixed(0))}
                    {stat(
                        'Overtime',
                        `${props.month_overtime_hours.toFixed(1)} h`,
                    )}
                    {stat('Leave taken', `${props.leave_days_taken} d`)}
                </div>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Detail label="Hired" value={day(employee.hire_date)} />
                    <Detail
                        label="Type"
                        value={
                            props.types[employee.employment_type] ??
                            employee.employment_type
                        }
                    />
                    <Detail
                        label="Paid"
                        value={
                            props.schedules[employee.pay_schedule] ??
                            employee.pay_schedule
                        }
                    />
                    <Detail
                        label="Allowance"
                        value={money(employee.monthly_allowance)}
                    />
                    <Detail
                        label="Daily rate"
                        value={money(employee.daily_rate)}
                    />
                    <Detail
                        label="Hourly rate"
                        value={money(employee.hourly_rate)}
                    />
                    <Detail label="Phone" value={employee.phone ?? '—'} />
                    <Detail
                        label="Gross monthly"
                        value={money(
                            employee.base_salary + employee.monthly_allowance,
                        )}
                    />
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                    <section>
                        <h2 className="font-display text-xl">Recent hours</h2>
                        <div className="mt-3 overflow-x-auto border border-border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left text-muted-foreground">
                                        <th className="px-4 py-3 font-normal">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 font-normal">
                                            In
                                        </th>
                                        <th className="px-4 py-3 font-normal">
                                            Out
                                        </th>
                                        <th className="px-4 py-3 text-right font-normal">
                                            Hours
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {props.attendance.map((row) => (
                                        <tr
                                            key={row.work_date}
                                            className="border-b border-border last:border-0"
                                        >
                                            <td className="px-4 py-3 tabular-nums">
                                                {day(row.work_date)}
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
                                                {row.overtime_minutes > 0 && (
                                                    <span className="block text-xs text-gold-deep">
                                                        +
                                                        {Math.round(
                                                            row.overtime_minutes /
                                                                60,
                                                        )}{' '}
                                                        h OT
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {props.attendance.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                No hours recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="flex flex-col gap-6">
                        <div>
                            <h2 className="font-display text-xl">Time off</h2>
                            <ul className="mt-3 flex flex-col divide-y divide-border border border-border">
                                {props.leaves.map((leave) => (
                                    <li
                                        key={leave.id}
                                        className="flex items-center gap-3 px-4 py-3 text-sm"
                                    >
                                        <span className="flex-1">
                                            {day(leave.from_date)} –{' '}
                                            {day(leave.to_date)}
                                            <span className="block text-xs text-muted-foreground">
                                                {leave.type} · {leave.days} d
                                                {leave.reason
                                                    ? ` · ${leave.reason}`
                                                    : ''}
                                            </span>
                                        </span>
                                        <span
                                            className={cn(
                                                'inline-flex border px-2 py-1 text-xs',
                                                personTone(leave.status),
                                            )}
                                        >
                                            {leave.status}
                                        </span>
                                    </li>
                                ))}
                                {props.leaves.length === 0 && (
                                    <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                                        No time off on record.
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="font-display text-xl">
                                    Deductions
                                </h2>
                                {can('hr.create') && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            setAddingDeduction((v) => !v)
                                        }
                                    >
                                        {addingDeduction ? (
                                            <X className="h-3 w-3" />
                                        ) : (
                                            <Plus className="h-3 w-3" />
                                        )}
                                        {addingDeduction
                                            ? 'Cancel'
                                            : 'Add a loan or advance'}
                                    </Button>
                                )}
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Anything taken off every pay run until it is
                                cleared, or off one period.
                            </p>

                            {addingDeduction && (
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        deduction.post(
                                            payroll.adjustments.store().url,
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    deduction.reset();
                                                    setAddingDeduction(false);
                                                },
                                            },
                                        );
                                    }}
                                    className="mt-3 grid gap-3 border border-border bg-background p-4 sm:grid-cols-2"
                                >
                                    <div className="grid gap-1">
                                        <Label htmlFor="deduction-label">
                                            What is it
                                        </Label>
                                        <Input
                                            id="deduction-label"
                                            value={deduction.data.label}
                                            onChange={(e) =>
                                                deduction.setData(
                                                    'label',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Emergency loan"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="deduction-kind">
                                            Kind
                                        </Label>
                                        <select
                                            id="deduction-kind"
                                            value={deduction.data.kind}
                                            onChange={(e) =>
                                                deduction.setData(
                                                    'kind',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-10 border border-border bg-background px-2 text-sm"
                                        >
                                            {Object.entries(
                                                props.adjustment_kinds,
                                            ).map(([key, label]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="deduction-amount">
                                            Amount
                                        </Label>
                                        <Input
                                            id="deduction-amount"
                                            type="number"
                                            min={0.01}
                                            step="0.01"
                                            value={deduction.data.amount}
                                            onChange={(e) =>
                                                deduction.setData(
                                                    'amount',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="deduction-period">
                                            Only in one period
                                        </Label>
                                        <Input
                                            id="deduction-period"
                                            placeholder="YYYY-MM, or blank for every run"
                                            value={deduction.data.period}
                                            onChange={(e) =>
                                                deduction.setData(
                                                    'period',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="flex gap-2 sm:col-span-2">
                                        <Button
                                            type="submit"
                                            disabled={deduction.processing}
                                            className="h-9 bg-plum text-white hover:bg-plum-deep"
                                        >
                                            {deduction.processing && (
                                                <Spinner />
                                            )}
                                            Record
                                        </Button>
                                    </div>
                                </form>
                            )}

                            <ul className="mt-3 flex flex-col divide-y divide-border border border-border">
                                {props.adjustments.map((row) => (
                                    <li
                                        key={row.id}
                                        className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
                                    >
                                        <span
                                            className={cn(
                                                'flex-1',
                                                !row.is_active &&
                                                    'text-muted-foreground line-through',
                                            )}
                                        >
                                            {row.label}
                                            <span className="block text-xs text-muted-foreground">
                                                {props.adjustment_kinds[
                                                    row.kind
                                                ] ?? row.kind}
                                                {row.period
                                                    ? ` — only in ${row.period}`
                                                    : ' — every run'}
                                            </span>
                                        </span>
                                        <span className="tabular-nums">
                                            {money(row.amount)}
                                        </span>
                                        {can('hr.create') && row.is_active && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    action.post(
                                                        payroll.adjustments.clear(
                                                            row.id,
                                                        ).url,
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                                aria-label={`Clear ${row.label}`}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </li>
                                ))}
                                {props.adjustments.length === 0 && (
                                    <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                                        Nothing is being deducted beyond the
                                        government contributions.
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl">Payslips</h2>
                            <ul className="mt-3 flex flex-col divide-y divide-border border border-border">
                                {props.payslips.map((slip) => (
                                    <li
                                        key={slip.id}
                                        className="flex items-center gap-3 px-4 py-3 text-sm"
                                    >
                                        <span className="flex-1">
                                            {slip.label}
                                            <span className="block text-xs text-muted-foreground">
                                                {slip.period}
                                            </span>
                                        </span>
                                        <span className="text-muted-foreground tabular-nums">
                                            gross {money(slip.gross)}
                                        </span>
                                        <Link
                                            href={payroll.payslip(slip.id).url}
                                            className="tabular-nums underline underline-offset-4"
                                        >
                                            {money(slip.net)}
                                        </Link>
                                    </li>
                                ))}
                                {props.payslips.length === 0 && (
                                    <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                                        Not been on a pay run yet.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

const Detail = ({ label, value }: { label: string; value: string }) => (
    <div className="border border-border bg-background px-4 py-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="tabular-nums">{value}</p>
    </div>
);
