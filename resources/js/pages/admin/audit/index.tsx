import { Head, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ago } from '@/lib/admin';
import { dashboard } from '@/routes';
import audit from '@/routes/admin/audit';

type Entry = {
    id: number;
    action: string;
    group: string;
    group_label: string;
    description: string;
    who: string;
    context: Record<string, unknown> | null;
    ip: string | null;
    at: string;
};

type Props = {
    entries: {
        data: Entry[];
        links?: { url: string | null; label: string; active: boolean }[];
    };
    groups: { key: string; label: string }[];
    group: string;
    query: string;
    total: number;
};

export default function AuditIndex({
    entries,
    groups,
    group,
    query,
    total,
}: Props) {
    const go = (next: Record<string, string>) =>
        router.visit(
            audit.index({
                query: { group: group === 'all' ? '' : group, ...next },
            }).url,
        );

    return (
        <>
            <Head title="Audit log" />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header>
                    <h1 className="font-display text-3xl md:text-4xl">
                        Audit log
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Who did what, and when. {String(total)} entries. Nothing
                        here can be edited or removed, including from this
                        screen.
                    </p>
                </header>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        // FormData.get returns a File when a file input is
                        // named, so it is narrowed rather than stringified --
                        // String(file) would read "[object File]".
                        const raw = new FormData(event.currentTarget).get('q');
                        go({ q: typeof raw === 'string' ? raw : '' });
                    }}
                    className="flex flex-wrap items-end gap-2"
                >
                    <div className="grid gap-1">
                        <label
                            htmlFor="group"
                            className="text-xs text-muted-foreground"
                        >
                            Area
                        </label>
                        <select
                            id="group"
                            name="group"
                            value={group}
                            onChange={(event) =>
                                go({ group: event.target.value })
                            }
                            className="h-9 border border-border bg-background px-2 text-sm"
                        >
                            <option value="all">Everything</option>
                            {groups.map((g) => (
                                <option key={g.key} value={g.key}>
                                    {g.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid flex-1 gap-1 sm:max-w-xs">
                        <label
                            htmlFor="q"
                            className="text-xs text-muted-foreground"
                        >
                            Search
                        </label>
                        <Input
                            id="q"
                            name="q"
                            defaultValue={query}
                            placeholder="Refund, Hydra Facial, ..."
                        />
                    </div>
                    <Button type="submit" variant="outline">
                        Filter
                    </Button>
                </form>

                {entries.data.length === 0 ? (
                    <p className="border-y border-border py-10 text-muted-foreground">
                        Nothing recorded yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-border border-y border-border">
                        {entries.data.map((entry) => (
                            <li
                                key={entry.id}
                                className="flex flex-wrap items-start justify-between gap-3 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm">
                                        {entry.description}
                                    </p>
                                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span>{entry.who}</span>
                                        <span aria-hidden>&middot;</span>
                                        <span>{ago(entry.at)}</span>
                                        {entry.ip && (
                                            <>
                                                <span aria-hidden>
                                                    &middot;
                                                </span>
                                                <span className="tabular-nums">
                                                    {entry.ip}
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </div>
                                <Badge variant="secondary">
                                    {entry.group_label}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

AuditIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Audit log', href: audit.index() },
    ],
};
