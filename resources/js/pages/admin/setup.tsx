import { Head, useForm } from '@inertiajs/react';
import { Database, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import setup from '@/routes/admin/setup';

type Count = { key: string; label: string; count: number };

type Props = {
    counts: Count[];
    seeder: string;
};

export default function ClinicSetup({ counts, seeder }: Props) {
    const form = useForm({});
    const rows = counts.reduce((sum, row) => sum + row.count, 0);

    return (
        <>
            <Head title="Clinic data" />
            <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
                <header>
                    <h1 className="font-display text-3xl md:text-4xl">
                        Clinic data
                    </h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        The permissions your screens are gated on, the ledger
                        accounts the bookkeeping posts against, the content the
                        public site reads, and the demonstration staff,
                        appointments, sales and enquiries the dashboards and
                        reports are drawn from.
                    </p>
                </header>

                <section>
                    <h2 className="font-display text-xl">What is loaded</h2>
                    <dl className="mt-4 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-4">
                        {counts.map((row) => (
                            <div
                                key={row.key}
                                className="bg-background px-4 py-3"
                            >
                                <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                                    {row.label}
                                </dt>
                                <dd className="mt-1 font-display text-2xl tabular-nums">
                                    {row.count}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-3 text-sm text-muted-foreground">
                        {rows} rows across {counts.length} lists, from {seeder}.
                    </p>
                </section>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(setup.store().url, {
                            preserveScroll: true,
                        });
                    }}
                >
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? (
                            <>
                                <Spinner /> Loading clinic data...
                            </>
                        ) : (
                            <>
                                <Database aria-hidden /> Load clinic data
                            </>
                        )}
                    </Button>
                </form>

                <section className="max-w-2xl space-y-3 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                        <ShieldCheck
                            className="mt-0.5 size-4 shrink-0 text-gold-deep"
                            aria-hidden
                        />
                        <span>
                            Loading is safe to repeat. Every list is matched on
                            its own key and updated in place, so pressing this
                            again refreshes the wording without duplicating
                            anything or touching a record you have entered.
                        </span>
                    </p>
                    <p>
                        It never changes the password of an account that already
                        exists, and never renames a branch. New demo accounts
                        are created with the password <code>password</code>, so
                        change those before this site is reachable by anyone
                        else.
                    </p>
                    <p>
                        The staff, appointments, sales and enquiries it adds are
                        fictional. They are here so the screens have something
                        to show; clear them once the clinic is taking its own
                        bookings.
                    </p>
                </section>
            </div>
        </>
    );
}

ClinicSetup.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Clinic data', href: setup.index() },
    ],
};
