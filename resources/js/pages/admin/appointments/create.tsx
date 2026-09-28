import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Field, { control } from '@/components/admin/field';
import InputError from '@/components/input-error';
import type { Labels } from '@/lib/admin';
import { clock, formatDate, manilaDate } from '@/lib/admin';
import { manilaNow, splitTime, toIsoDate } from '@/lib/site';
import { cn } from '@/lib/utils';
import bookRoutes from '@/routes/book';
import appointments from '@/routes/admin/appointments';
import leads from '@/routes/admin/leads';

type Props = {
    date: string;
    treatments: { id: number; name: string; duration_minutes: number }[];
    branches: { id: number; name: string }[];
    specialists: {
        id: number;
        name: string;
        title: string;
        branch_ids: number[];
    }[];
    lead: { id: number; name: string; phone: string | null } | null;
    moving: {
        id: number;
        reference: string;
        treatment_id: number;
        branch_id: number;
        specialist_id: number;
        starts_at: string;
    } | null;
    sources: Labels;
};

export default function AppointmentCreate({
    date,
    treatments,
    branches,
    specialists,
    lead,
    moving,
    sources,
}: Props) {
    const today = toIsoDate(manilaNow());
    const startDate = moving
        ? manilaDate(moving.starts_at)
        : date < today
          ? today
          : date;
    const form = useForm({
        treatment_id: String(moving?.treatment_id ?? ''),
        branch_id: String(moving?.branch_id ?? branches[0]?.id ?? ''),
        specialist_id: String(moving?.specialist_id ?? ''),
        date: startDate,
        time: '',
        status: 'confirmed',
        notes: '',
        lead_id: lead && !moving ? String(lead.id) : '',
        reschedule_id: moving ? String(moving.id) : '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        source: 'phone',
        privacy_consent: false,
    });
    const { data, setData, errors } = form;
    const [slots, setSlots] = useState<string[] | null>(null);
    const atBranch = useMemo(
        () =>
            specialists.filter((s) =>
                s.branch_ids.includes(Number(data.branch_id)),
            ),
        [specialists, data.branch_id],
    );

    useEffect(() => {
        if (!data.treatment_id || !data.branch_id || !data.date) {
            setSlots(null);

            return;
        }

        const controller = new AbortController();
        setSlots(null);
        fetch(
            bookRoutes.slots({
                query: {
                    treatment_id: data.treatment_id,
                    branch_id: data.branch_id,
                    date: data.date,
                    ...(data.specialist_id
                        ? { specialist_id: data.specialist_id }
                        : {}),
                },
            }).url,
            {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            },
        )
            .then((r) => (r.ok ? r.json() : { slots: [] }))
            .then((res: { slots: string[] }) => setSlots(res.slots))
            .catch(() => undefined);

        return () => controller.abort();
    }, [data.treatment_id, data.branch_id, data.specialist_id, data.date]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(appointments.store().url, { preserveScroll: true });
    };

    const title = moving ? `Move ${moving.reference}` : 'New appointment';

    return (
        <>
            <Head title={title} />
            <form
                onSubmit={submit}
                className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-8 md:py-8"
            >
                <header>
                    <h1 className="font-display text-3xl md:text-4xl">
                        {title}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {moving
                            ? `For ${lead?.name ?? 'this client'}, now on ${formatDate(moving.starts_at, { weekday: 'short', day: 'numeric', month: 'short' })} at ${clock(moving.starts_at).join(' ')}. The old time is released when you save.`
                            : lead
                              ? `For ${lead.name}${lead.phone ? `, ${lead.phone}` : ''}.`
                              : 'For a phone call, walk-in or message. A lead is created for the client.'}
                    </p>
                </header>

                <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
                    <section
                        aria-labelledby="visit"
                        className="flex flex-col gap-5"
                    >
                        <h2 id="visit" className="text-lg font-medium">
                            Visit
                        </h2>
                        <div className="grid gap-5 sm:grid-cols-3">
                            <Field
                                label="Treatment"
                                htmlFor="treatment"
                                error={errors.treatment_id}
                            >
                                <select
                                    id="treatment"
                                    required
                                    value={data.treatment_id}
                                    onChange={(e) =>
                                        setData('treatment_id', e.target.value)
                                    }
                                    className={control}
                                >
                                    <option value="">Choose a treatment</option>
                                    {treatments.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.duration_minutes} min)
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Branch"
                                htmlFor="branch"
                                error={errors.branch_id}
                            >
                                <select
                                    id="branch"
                                    value={data.branch_id}
                                    onChange={(e) =>
                                        setData((d) => ({
                                            ...d,
                                            branch_id: e.target.value,
                                            specialist_id: '',
                                            time: '',
                                        }))
                                    }
                                    className={control}
                                >
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Specialist"
                                htmlFor="specialist"
                                error={errors.specialist_id}
                            >
                                <select
                                    id="specialist"
                                    value={data.specialist_id}
                                    onChange={(e) =>
                                        setData((d) => ({
                                            ...d,
                                            specialist_id: e.target.value,
                                            time: '',
                                        }))
                                    }
                                    className={control}
                                >
                                    <option value="">First available</option>
                                    {atBranch.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        <Field
                            label="Date"
                            htmlFor="date"
                            error={errors.date}
                            className="sm:max-w-56"
                        >
                            <input
                                id="date"
                                type="date"
                                min={today}
                                required
                                value={data.date}
                                onChange={(e) =>
                                    setData((d) => ({
                                        ...d,
                                        date: e.target.value,
                                        time: '',
                                    }))
                                }
                                className={control}
                            />
                        </Field>

                        <fieldset>
                            <legend className="mb-2 text-sm font-medium">
                                Time
                            </legend>
                            {!data.treatment_id ? (
                                <p className="text-sm text-muted-foreground">
                                    Choose a treatment to see open times.
                                </p>
                            ) : slots === null ? (
                                <p className="text-sm text-muted-foreground">
                                    Checking the schedule...
                                </p>
                            ) : slots.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No open times on this day. Try another date
                                    or specialist.
                                </p>
                            ) : (
                                <div className="grid grid-cols-3 gap-px border border-border bg-border sm:grid-cols-6 lg:grid-cols-8">
                                    {slots.map((slot) => {
                                        const [t, p] = splitTime(slot);

                                        return (
                                            <button
                                                key={slot}
                                                type="button"
                                                aria-pressed={
                                                    data.time === slot
                                                }
                                                onClick={() =>
                                                    setData('time', slot)
                                                }
                                                className={cn(
                                                    'h-11 text-sm tabular-nums transition-colors duration-150 ease-out',
                                                    data.time === slot
                                                        ? 'bg-plum text-white'
                                                        : 'bg-background hover:bg-mist dark:hover:bg-white/5',
                                                )}
                                            >
                                                {t}{' '}
                                                <span className="text-[11px] opacity-70">
                                                    {p}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <InputError
                                message={errors.time}
                                className="mt-2"
                            />
                        </fieldset>

                        <fieldset className="flex flex-wrap gap-2">
                            <legend className="mb-2 text-sm font-medium">
                                Status
                            </legend>
                            {[
                                ['confirmed', 'Confirmed with the client'],
                                ['pending', 'Pending, confirm later'],
                            ].map(([value, label]) => (
                                <label
                                    key={value}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm',
                                        data.status === value
                                            ? 'border-plum'
                                            : 'border-border',
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={value}
                                        checked={data.status === value}
                                        onChange={() =>
                                            setData('status', value)
                                        }
                                        className="accent-plum"
                                    />
                                    {label}
                                </label>
                            ))}
                        </fieldset>

                        <Field
                            label="Notes"
                            htmlFor="notes"
                            hint="(optional)"
                            error={errors.notes}
                        >
                            <textarea
                                id="notes"
                                rows={3}
                                value={data.notes}
                                onChange={(e) =>
                                    setData('notes', e.target.value)
                                }
                                className={cn(control, 'h-auto py-2')}
                            />
                        </Field>
                    </section>

                    {!lead && !moving && (
                        <section
                            aria-labelledby="client"
                            className="flex flex-col gap-5"
                        >
                            <h2 id="client" className="text-lg font-medium">
                                Client
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="First name"
                                    htmlFor="first_name"
                                    error={errors.first_name}
                                >
                                    <input
                                        id="first_name"
                                        required
                                        autoComplete="off"
                                        value={data.first_name}
                                        onChange={(e) =>
                                            setData(
                                                'first_name',
                                                e.target.value,
                                            )
                                        }
                                        className={control}
                                    />
                                </Field>
                                <Field
                                    label="Last name"
                                    htmlFor="last_name"
                                    error={errors.last_name}
                                >
                                    <input
                                        id="last_name"
                                        autoComplete="off"
                                        value={data.last_name}
                                        onChange={(e) =>
                                            setData('last_name', e.target.value)
                                        }
                                        className={control}
                                    />
                                </Field>
                            </div>
                            <Field
                                label="Mobile number"
                                htmlFor="phone"
                                error={errors.phone}
                            >
                                <input
                                    id="phone"
                                    type="tel"
                                    required
                                    inputMode="tel"
                                    placeholder="0917 123 4567"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                    className={control}
                                />
                            </Field>
                            <Field
                                label="Email"
                                htmlFor="email"
                                hint="(optional)"
                                error={errors.email}
                            >
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    className={control}
                                />
                            </Field>
                            <Field
                                label="How they reached us"
                                htmlFor="source"
                                error={errors.source}
                            >
                                <select
                                    id="source"
                                    value={data.source}
                                    onChange={(e) =>
                                        setData('source', e.target.value)
                                    }
                                    className={control}
                                >
                                    {Object.entries(sources).map(
                                        ([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </Field>
                            <label className="flex items-start gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.privacy_consent}
                                    onChange={(e) =>
                                        setData(
                                            'privacy_consent',
                                            e.target.checked,
                                        )
                                    }
                                    className="mt-1 accent-plum"
                                />
                                The client agreed to the privacy notice
                            </label>
                        </section>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
                    <button
                        type="submit"
                        disabled={form.processing || !data.time}
                        className="bg-plum px-5 py-2.5 text-sm font-medium text-white transition-[background-color,transform] duration-150 ease-out hover:bg-plum-deep active:scale-[0.97] disabled:opacity-50"
                    >
                        {moving ? 'Move appointment' : 'Book appointment'}
                    </button>
                    <Link
                        href={
                            lead
                                ? leads.show(lead.id).url
                                : appointments.index().url
                        }
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                        Cancel
                    </Link>
                    {data.time && (
                        <p className="text-sm text-muted-foreground">
                            {formatDate(`${data.date}T12:00:00+08:00`, {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}{' '}
                            at {splitTime(data.time).join(' ')}
                        </p>
                    )}
                </div>
            </form>
        </>
    );
}

AppointmentCreate.layout = {
    breadcrumbs: [
        { title: 'Appointments', href: appointments.index() },
        { title: 'New', href: appointments.create() },
    ],
};
