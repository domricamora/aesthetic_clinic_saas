import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import payroll from '@/routes/admin/payroll';

type Props = {
    settings: {
        sss_rate: number;
        sss_ceiling: number;
        sss_max: number;
        philhealth_rate: number;
        philhealth_ceiling: number;
        philhealth_max: number;
        pagibig_rate: number;
        pagibig_ceiling: number;
        pagibig_max: number;
        effective_from: string | null;
        configured: boolean;
    };
    defaults: {
        sss_rate: number;
        philhealth_rate: number;
        pagibig_rate: number;
    };
};

type RateKey =
    | 'sss_rate'
    | 'sss_ceiling'
    | 'sss_max'
    | 'philhealth_rate'
    | 'philhealth_ceiling'
    | 'philhealth_max'
    | 'pagibig_rate'
    | 'pagibig_ceiling'
    | 'pagibig_max';

type Group = {
    key: 'sss' | 'philhealth' | 'pagibig';
    label: string;
    who: string;
    note: string;
};

const GROUPS: Group[] = [
    {
        key: 'sss',
        label: 'SSS',
        who: 'Social Security',
        note: 'Taken on the salary up to the ceiling, never more than the maximum.',
    },
    {
        key: 'philhealth',
        label: 'PhilHealth',
        who: 'National Health Insurance',
        note: 'Taken on the salary up to the ceiling, never more than the maximum.',
    },
    {
        key: 'pagibig',
        label: 'Pag-IBIG',
        who: 'HDMF',
        note: 'The employee share, which is half of the total premium.',
    },
];

export default function PayrollSettings({ settings }: Props) {
    const form = useForm({
        sss_rate: String(settings.sss_rate),
        sss_ceiling: String(settings.sss_ceiling),
        sss_max: String(settings.sss_max),
        philhealth_rate: String(settings.philhealth_rate),
        philhealth_ceiling: String(settings.philhealth_ceiling),
        philhealth_max: String(settings.philhealth_max),
        pagibig_rate: String(settings.pagibig_rate),
        pagibig_ceiling: String(settings.pagibig_ceiling),
        pagibig_max: String(settings.pagibig_max),
        effective_from: settings.effective_from ?? '',
    });

    const field = (key: RateKey, label: string, hint?: string) => (
        <div className="grid gap-1">
            <Label htmlFor={key}>{label}</Label>
            <Input
                id={key}
                type="number"
                min={0}
                step="0.0001"
                value={form.data[key]}
                onChange={(event) => form.setData(key, event.target.value)}
            />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {form.errors[key] && (
                <p className="text-sm text-destructive">{form.errors[key]}</p>
            )}
        </div>
    );

    return (
        <>
            <Head title="Deductions" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Link
                            href={payroll.index().url}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Payroll
                        </Link>
                        <h1 className="mt-2 font-display text-3xl md:text-4xl">
                            Deductions
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            What comes off a payslip, and the rates behind the
                            government contributions.
                        </p>
                    </div>
                </header>

                <p className="flex max-w-3xl items-start gap-3 border border-gold/40 bg-background px-4 py-3 text-sm">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                    <span>
                        These figures move with the law and are adjusted by
                        circulars through the year. Have a payroll specialist
                        check them before a real pay run, and treat them as
                        defaults rather than advice.
                    </span>
                </p>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.patch(payroll.settings.update().url, {
                            preserveScroll: true,
                        });
                    }}
                    className="flex flex-col gap-6"
                >
                    {GROUPS.map((group) => (
                        <section
                            key={group.key}
                            className="border border-border bg-background p-5"
                        >
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h2 className="font-display text-xl">
                                    {group.label}
                                </h2>
                                <span className="text-sm text-muted-foreground">
                                    {group.who}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {group.note}
                            </p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                {field(
                                    `${group.key}_rate`,
                                    'Rate',
                                    'A share of the salary: 5% is 0.05',
                                )}
                                {field(
                                    `${group.key}_ceiling`,
                                    'Salary ceiling',
                                    'The most that counts',
                                )}
                                {field(
                                    `${group.key}_max`,
                                    'Maximum',
                                    'Never more than this',
                                )}
                            </div>
                        </section>
                    ))}

                    <div className="flex flex-wrap items-end gap-4">
                        <div className="grid gap-1">
                            <Label htmlFor="effective_from">
                                Effective from
                            </Label>
                            <Input
                                id="effective_from"
                                type="date"
                                value={form.data.effective_from}
                                onChange={(event) =>
                                    form.setData(
                                        'effective_from',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <p className="flex-1 text-sm text-muted-foreground">
                            {settings.configured
                                ? 'These rates are the clinic’s own. Payslips already calculated keep the figures they were paid.'
                                : 'Still on the defaults from config/payroll.php. Saving writes this clinic’s own rates.'}
                        </p>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-10 bg-plum text-white hover:bg-plum-deep"
                        >
                            {form.processing && <Spinner />}
                            Save rates
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
