import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import Field, { control } from '@/components/admin/field';
import type { Labels } from '@/lib/admin';
import { cn } from '@/lib/utils';
import leads from '@/routes/admin/leads';

type Props = {
    sources: Labels;
    treatments: { id: number; name: string }[];
    branches: { id: number; name: string }[];
};

export default function LeadCreate({ sources, treatments, branches }: Props) {
    const form = useForm({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        source: 'phone',
        treatment_id: '',
        branch_id: '',
        message: '',
        privacy_consent: false,
        marketing_consent: false,
    });
    const { data, setData, errors } = form;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(leads.store().url);
    };

    return (
        <>
            <Head title="Add lead" />
            <form
                onSubmit={submit}
                className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-8 md:py-8"
            >
                <header>
                    <h1 className="font-display text-3xl md:text-4xl">
                        Add lead
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Log someone who called, walked in or sent a message.
                        They start as a new lead.
                    </p>
                </header>

                <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
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
                                setData('first_name', e.target.value)
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
                    <Field
                        label="Mobile number"
                        htmlFor="phone"
                        error={errors.phone}
                    >
                        <input
                            id="phone"
                            type="tel"
                            inputMode="tel"
                            placeholder="0917 123 4567"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className={control}
                        />
                    </Field>
                    <Field label="Email" htmlFor="email" error={errors.email}>
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
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
                            onChange={(e) => setData('source', e.target.value)}
                            className={control}
                        >
                            {Object.entries(sources).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field
                        label="Interested in"
                        htmlFor="treatment"
                        hint="(optional)"
                        error={errors.treatment_id}
                    >
                        <select
                            id="treatment"
                            value={data.treatment_id}
                            onChange={(e) =>
                                setData('treatment_id', e.target.value)
                            }
                            className={control}
                        >
                            <option value="">Not sure yet</option>
                            {treatments.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field
                        label="Preferred branch"
                        htmlFor="branch"
                        hint="(optional)"
                        error={errors.branch_id}
                    >
                        <select
                            id="branch"
                            value={data.branch_id}
                            onChange={(e) =>
                                setData('branch_id', e.target.value)
                            }
                            className={control}
                        >
                            <option value="">No preference</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field
                        label="What they asked"
                        htmlFor="message"
                        hint="(optional)"
                        error={errors.message}
                        className="sm:col-span-2"
                    >
                        <textarea
                            id="message"
                            rows={3}
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            className={cn(control, 'h-auto py-2')}
                        />
                    </Field>
                    <div className="flex flex-col gap-2 text-sm sm:col-span-2">
                        <label className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                checked={data.privacy_consent}
                                onChange={(e) =>
                                    setData('privacy_consent', e.target.checked)
                                }
                                className="mt-1 accent-plum"
                            />
                            The client agreed to the privacy notice
                        </label>
                        <label className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                checked={data.marketing_consent}
                                onChange={(e) =>
                                    setData(
                                        'marketing_consent',
                                        e.target.checked,
                                    )
                                }
                                className="mt-1 accent-plum"
                            />
                            The client wants promotions and updates
                        </label>
                    </div>
                </div>

                <div className="flex items-center gap-4 border-t border-border pt-6">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="bg-plum px-5 py-2.5 text-sm font-medium text-white transition-[background-color,transform] duration-150 ease-out hover:bg-plum-deep active:scale-[0.97] disabled:opacity-50"
                    >
                        Add lead
                    </button>
                    <Link
                        href={leads.index().url}
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </>
    );
}

LeadCreate.layout = {
    breadcrumbs: [
        { title: 'Leads', href: leads.index() },
        { title: 'Add lead', href: leads.create() },
    ],
};
