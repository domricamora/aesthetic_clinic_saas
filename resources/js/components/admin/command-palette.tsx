import { router } from '@inertiajs/react';
import {
    CalendarDays,
    CalendarPlus,
    ExternalLink,
    LayoutGrid,
    Search,
    UserPlus,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { useCan } from '@/lib/admin';
import { manilaNow, toIsoDate } from '@/lib/site';
import { cn } from '@/lib/utils';
import { book, dashboard, home } from '@/routes';
import admin from '@/routes/admin';
import appointments from '@/routes/admin/appointments';
import leads from '@/routes/admin/leads';

type Found = { id: number; name: string; phone: string | null; stage: string };

type Item = {
    key: string;
    label: string;
    meta?: string;
    icon: LucideIcon;
    run: () => void;
};

/** The palette is mounted once in the admin layout; any screen can ask it to open. */
export const openPalette = (): void => {
    window.dispatchEvent(new Event('admin:palette'));
};

export default function CommandPalette() {
    const can = useCan();
    const canSeeLeads = can('leads.view');
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [found, setFound] = useState<Found[]>([]);
    const [searching, setSearching] = useState(false);
    const [active, setActive] = useState(0);
    const input = useRef<HTMLInputElement>(null);

    const today = toIsoDate(manilaNow());

    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen((wasOpen) => !wasOpen);
            }
        };
        const onAsk = () => setOpen(true);

        window.addEventListener('keydown', onKey);
        window.addEventListener('admin:palette', onAsk);

        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('admin:palette', onAsk);
        };
    }, []);

    useEffect(() => {
        const search = query.trim();

        if (!open || !canSeeLeads || search.length < 2) {
            setFound([]);
            setSearching(false);

            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => {
            setSearching(true);
            fetch(admin.search({ query: { q: search } }).url, {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            })
                .then((r) => (r.ok ? r.json() : []))
                .then((rows: Found[]) => {
                    setFound(rows);
                    setSearching(false);
                })
                .catch(() => undefined);
        }, 180);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, open, canSeeLeads]);

    const go = (url: string) => {
        setOpen(false);
        router.visit(url);
    };
    const visitSite = (url: string) => {
        setOpen(false);
        window.open(url, '_blank', 'noreferrer');
    };

    const actions: Item[] = [
        can('appointments.create') && {
            key: 'new-appointment',
            label: 'New appointment',
            meta: 'Book a phone call or walk-in client',
            icon: CalendarPlus,
            run: () => go(appointments.create().url),
        },
        can('leads.create') && {
            key: 'new-lead',
            label: 'Create lead',
            meta: 'Log an enquiry before it becomes a visit',
            icon: UserPlus,
            run: () => go(leads.create().url),
        },
        can('appointments.view') && {
            key: 'today',
            label: "Open today's appointments",
            meta: 'Front desk day view',
            icon: CalendarDays,
            run: () => go(appointments.index({ query: { date: today } }).url),
        },
        canSeeLeads && {
            key: 'leads',
            label: 'All leads',
            meta: 'Pipeline by stage',
            icon: UsersRound,
            run: () => go(leads.index().url),
        },
        {
            key: 'dashboard',
            label: 'Dashboard',
            meta: 'Today at a glance',
            icon: LayoutGrid,
            run: () => go(dashboard().url),
        },
        {
            key: 'booking-page',
            label: 'Open the public booking page',
            meta: 'What a patient sees',
            icon: ExternalLink,
            run: () => visitSite(book().url),
        },
        {
            key: 'website',
            label: 'View the clinic website',
            meta: 'Marketing site',
            icon: ExternalLink,
            run: () => visitSite(home().url),
        },
    ].flatMap((action) => (action ? [action] : []));

    const search = query.trim().toLowerCase();
    const matchedActions = search
        ? actions.filter((action) =>
              `${action.label} ${action.meta ?? ''}`
                  .toLowerCase()
                  .includes(search),
          )
        : actions;

    const leadItems: Item[] = found.map((lead) => ({
        key: `lead-${lead.id}`,
        label: lead.name,
        meta: [lead.phone, lead.stage].filter(Boolean).join(' · '),
        icon: UsersRound,
        run: () => go(leads.show(lead.id).url),
    }));

    const items: Item[] = [...matchedActions, ...leadItems];
    const selection = items[Math.min(active, items.length - 1)];

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!items.length) {
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => (i + 1) % items.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => (i - 1 + items.length) % items.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            selection?.run();
        }
    };

    const list = (group: Item[], label: string, offset: number) =>
        group.length > 0 && (
            <div key={label} className="py-1">
                <p className="px-4 py-1.5 text-xs tracking-wide text-muted-foreground uppercase">
                    {label}
                </p>
                <ul role="listbox" id="palette-list" aria-label={label}>
                    {group.map((item, i) => {
                        const index = offset + i;
                        const Icon = item.icon;

                        return (
                            <li key={item.key}>
                                <button
                                    type="button"
                                    id={`palette-option-${item.key}`}
                                    role="option"
                                    aria-selected={index === active}
                                    onMouseEnter={() => setActive(index)}
                                    onClick={item.run}
                                    className={cn(
                                        'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm',
                                        index === active &&
                                            'bg-mist dark:bg-white/10',
                                    )}
                                >
                                    <Icon
                                        className="size-4 shrink-0 text-plum dark:text-lilac"
                                        aria-hidden
                                    />
                                    <span className="min-w-0 flex-1 truncate">
                                        {item.label}
                                    </span>
                                    {item.meta && (
                                        <span className="hidden truncate text-xs text-muted-foreground sm:block">
                                            {item.meta}
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (!next) {
                    setQuery('');
                    setActive(0);
                }
            }}
        >
            <DialogContent
                className="top-24 max-w-xl translate-y-0 gap-0 p-0 duration-150"
                onOpenAutoFocus={() => input.current?.focus()}
            >
                <DialogTitle className="sr-only">Command palette</DialogTitle>
                <DialogDescription className="sr-only">
                    Search leads or jump to a screen. Arrow keys move, Enter
                    opens, Escape closes.
                </DialogDescription>

                <div className="flex items-center border-b border-border">
                    <Search
                        className="ml-4 size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                    />
                    <input
                        ref={input}
                        type="text"
                        role="combobox"
                        aria-expanded
                        aria-controls="palette-list"
                        aria-activedescendant={
                            selection
                                ? `palette-option-${selection.key}`
                                : undefined
                        }
                        aria-label="Search leads or actions"
                        autoComplete="off"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActive(0);
                        }}
                        onKeyDown={onKeyDown}
                        placeholder="Search a lead, or jump to a screen"
                        className="h-14 w-full bg-transparent px-3 text-base outline-none"
                    />
                </div>

                <div className="max-h-80 overflow-y-auto">
                    {list(matchedActions, 'Actions', 0)}
                    {list(leadItems, 'Leads', matchedActions.length)}

                    {!items.length && (
                        <p className="px-4 py-6 text-sm text-muted-foreground">
                            {searching
                                ? 'Searching...'
                                : search && canSeeLeads
                                  ? 'Nothing matches that.'
                                  : 'Type a name, mobile number or email.'}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
                    <span>Arrow keys to move, Enter to open</span>
                    <span className="tabular-nums">Esc to close</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
