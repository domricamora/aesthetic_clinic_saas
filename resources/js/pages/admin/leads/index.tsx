import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import type { Labels, LeadRow } from '@/lib/admin';
import { ago, sourceLabel } from '@/lib/admin';
import { cn } from '@/lib/utils';
import leads from '@/routes/admin/leads';

type Props = {
    leads: {
        data: LeadRow[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
        from: number | null;
        to: number | null;
    };
    filters: { stage?: string; q?: string };
    stages: Labels;
    counts: Record<string, number>;
};

const pageLabel = (label: string): string =>
    label.replace('&laquo;', '‹').replace('&raquo;', '›');

export default function LeadsIndex({
    leads: page,
    filters,
    stages,
    counts,
}: Props) {
    const all = Object.values(counts).reduce((a, b) => a + b, 0);
    const tab = (stage: string | undefined, label: string, count: number) => (
        <Link
            key={stage ?? 'all'}
            href={leads.index({ query: { stage, q: filters.q } }).url}
            preserveScroll
            aria-current={filters.stage === stage ? 'page' : undefined}
            className={cn(
                '-mb-px shrink-0 border-b-2 px-3 py-3 text-sm whitespace-nowrap transition-colors duration-150 ease-out',
                filters.stage === stage
                    ? 'border-plum font-medium text-plum dark:border-lilac dark:text-lilac'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
        >
            {label} <span className="tabular-nums opacity-70">{count}</span>
        </Link>
    );

    return (
        <>
            <Head title="Leads" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-3xl md:text-4xl">
                            Leads
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Everyone who enquired or booked, from first message
                            to regular client.
                        </p>
                    </div>
                    <form
                        role="search"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const value = new FormData(e.currentTarget).get(
                                'q',
                            );
                            const q =
                                typeof value === 'string' ? value.trim() : '';
                            router.get(
                                leads.index({
                                    query: {
                                        stage: filters.stage,
                                        q: q || undefined,
                                    },
                                }).url,
                                {},
                                { preserveState: true },
                            );
                        }}
                        className="flex w-full items-center border border-input bg-background focus-within:border-violet sm:w-auto"
                    >
                        <Search
                            aria-hidden
                            className="ml-3 size-4 shrink-0 text-muted-foreground"
                        />
                        <input
                            type="search"
                            name="q"
                            defaultValue={filters.q}
                            placeholder="Search name, email or phone"
                            aria-label="Search leads"
                            className="h-10 w-full bg-transparent px-3 text-sm outline-none sm:w-72"
                        />
                    </form>
                </header>

                <nav
                    aria-label="Pipeline stage"
                    className="flex overflow-x-auto border-b border-border"
                >
                    {tab(undefined, 'All', all)}
                    {Object.entries(stages).map(([key, label]) =>
                        tab(key, label, counts[key] ?? 0),
                    )}
                </nav>

                {page.data.length === 0 ? (
                    <p className="py-10 text-muted-foreground">
                        {filters.q
                            ? `No leads match "${filters.q}".`
                            : 'No leads at this stage yet.'}
                    </p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="sr-only md:not-sr-only">
                            <tr className="border-b border-border text-left text-xs text-muted-foreground">
                                <th className="py-2 pr-4 font-normal">Name</th>
                                <th className="py-2 pr-4 font-normal">
                                    Interested in
                                </th>
                                <th className="py-2 pr-4 font-normal">
                                    Came from
                                </th>
                                <th className="py-2 pr-4 font-normal">Stage</th>
                                <th className="py-2 text-right font-normal">
                                    Received
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border border-b border-border">
                            {page.data.map((lead) => (
                                <tr
                                    key={lead.id}
                                    className="relative grid grid-cols-[1fr_auto] gap-x-4 py-3 transition-colors duration-150 ease-out hover:bg-mist md:table-row md:py-0 dark:hover:bg-white/5"
                                >
                                    <td className="min-w-0 md:py-3 md:pr-4">
                                        <Link
                                            href={leads.show(lead.id).url}
                                            className="font-medium after:absolute after:inset-0"
                                        >
                                            {lead.name}
                                        </Link>
                                        <span className="block truncate text-muted-foreground">
                                            {lead.phone ?? lead.email}
                                        </span>
                                    </td>
                                    <td className="hidden md:table-cell md:py-3 md:pr-4">
                                        {lead.treatment ?? 'General enquiry'}
                                    </td>
                                    <td className="col-start-1 text-muted-foreground md:py-3 md:pr-4">
                                        {sourceLabel(lead.source)}
                                        {lead.campaign && (
                                            <span className="block text-xs">
                                                {lead.campaign}
                                            </span>
                                        )}
                                    </td>
                                    <td className="col-start-2 row-start-1 text-right md:py-3 md:pr-4 md:text-left">
                                        <span
                                            className={cn(
                                                'inline-block border px-2 py-0.5 text-xs whitespace-nowrap',
                                                lead.stage === 'new'
                                                    ? 'border-gold text-gold-deep'
                                                    : 'border-border text-muted-foreground',
                                            )}
                                        >
                                            {stages[lead.stage]}
                                        </span>
                                    </td>
                                    <td className="col-start-2 row-start-2 text-right whitespace-nowrap text-muted-foreground md:py-3">
                                        {ago(lead.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {page.links.length > 3 && (
                    <nav
                        aria-label="Pages"
                        className="flex flex-wrap items-center justify-between gap-4 text-sm"
                    >
                        <p className="text-muted-foreground">
                            {page.from} to {page.to} of {page.total}
                        </p>
                        <div className="flex">
                            {page.links.map((link, i) =>
                                link.url ? (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        preserveScroll
                                        aria-current={
                                            link.active ? 'page' : undefined
                                        }
                                        className={cn(
                                            '-ml-px border border-border px-3 py-1.5',
                                            link.active &&
                                                'relative border-plum bg-plum text-white',
                                        )}
                                    >
                                        {pageLabel(link.label)}
                                    </Link>
                                ) : (
                                    <span
                                        key={i}
                                        className="-ml-px border border-border px-3 py-1.5 text-muted-foreground"
                                    >
                                        {pageLabel(link.label)}
                                    </span>
                                ),
                            )}
                        </div>
                    </nav>
                )}
            </div>
        </>
    );
}

LeadsIndex.layout = {
    breadcrumbs: [{ title: 'Leads', href: leads.index() }],
};
