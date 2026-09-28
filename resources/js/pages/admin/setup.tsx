import { Head, useForm } from '@inertiajs/react';
import { Database, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    const clear = useForm({});
    const [confirming, setConfirming] = useState(false);
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

                <section className="max-w-2xl space-y-3 border border-destructive/40 bg-destructive/5 p-5">
                    <h2 className="flex items-center gap-2 font-display text-xl text-destructive">
                        <TriangleAlert className="size-5" aria-hidden />
                        Start over
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Empties every list above so the next demonstration
                        starts from nothing rather than showing the last
                        clinic's appointments and takings. Your account, this
                        clinic and its branches all stay, so you remain signed
                        in.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {rows} rows would be removed and cannot be recovered
                        except by loading the demo data again.
                    </p>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setConfirming(true)}
                        disabled={clear.processing || rows === 0}
                    >
                        {clear.processing ? (
                            <>
                                <Spinner /> Clearing...
                            </>
                        ) : (
                            <>
                                <Trash2 aria-hidden /> Clear all clinic data
                            </>
                        )}
                    </Button>
                </section>

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
                <Dialog open={confirming} onOpenChange={setConfirming}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                Clear {rows} rows of clinic data?
                            </DialogTitle>
                            <DialogDescription>
                                Treatments, products, staff, appointments,
                                enquiries, sales, payroll and the books are
                                emptied. Your account, the clinic and its
                                branches are not, so you stay signed in.
                                <span className="mt-3 block font-medium text-foreground">
                                    This cannot be undone. Reload the demo data
                                    afterwards to get it back.
                                </span>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setConfirming(false)}
                            >
                                Keep it
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={clear.processing}
                                onClick={() => {
                                    clear.post(setup.clear().url, {
                                        preserveScroll: true,
                                        onFinish: () => setConfirming(false),
                                    });
                                }}
                            >
                                {clear.processing ? (
                                    <>
                                        <Spinner /> Clearing...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 aria-hidden /> Yes, clear it
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
