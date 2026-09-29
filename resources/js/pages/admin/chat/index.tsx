import { Head, Link } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ChatAvatar } from '@/components/chat-avatar';
import { Button } from '@/components/ui/button';
import { usePoll } from '@/hooks/use-poll';
import { formatDate } from '@/lib/admin';
import { dashboard } from '@/routes';
import chat from '@/routes/admin/chat';

type Row = {
    id: number;
    name: string;
    phone: string | null;
    page: string | null;
    preview: string;
    unread: number;
    messages: number;
    last_from: string | null;
    at: string | null;
};

type Props = {
    conversations: { data: Row[]; links?: { url: string | null }[] };
    unread: number;
};

export default function ChatInbox({ conversations, unread }: Props) {
    const initial = conversations.data;
    const [rows, setRows] = useState(initial);
    const [waiting, setWaiting] = useState(unread);
    // Ids that were not there a moment ago, so they can be marked briefly
    // rather than appearing with no explanation.
    const [fresh, setFresh] = useState<number[]>([]);

    // The page can be revisited, so a fresh Inertia payload replaces the list
    // outright. Without this, navigating away and back would show whatever the
    // last poll happened to return rather than what was just loaded.
    useEffect(() => {
        setRows(initial);
        setWaiting(unread);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversations, unread]);

    const merge = useCallback((data: { rows: Row[]; unread: number }) => {
        setRows((current) => {
            const known = new Set(current.map((row) => row.id));
            const arrivals = data.rows.filter((row) => !known.has(row.id));

            if (arrivals.length > 0) setFresh(arrivals.map((row) => row.id));

            return data.rows;
        });
        setWaiting(data.unread);
    }, []);

    useEffect(() => {
        if (fresh.length === 0) return;

        const timer = setTimeout(() => setFresh([]), 4000);
        return () => clearTimeout(timer);
    }, [fresh]);

    const { live } = usePoll<{ rows: Row[]; unread: number }>(
        chat.poll().url,
        merge,
        8000,
    );

    return (
        <>
            <Head title="Chat" />
            <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-3xl md:text-4xl">
                            Chat
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Conversations from the website, newest first.
                            {waiting > 0
                                ? ` ${waiting} waiting on a reply.`
                                : ' Nothing waiting.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span
                            className="flex items-center gap-1.5 text-xs text-muted-foreground"
                            title="New conversations appear here on their own"
                        >
                            <span
                                className={`size-1.5 rounded-full ${live ? 'bg-green-600' : 'bg-muted-foreground/40'}`}
                                aria-hidden
                            />
                            {live ? 'Updating' : 'Connecting'}
                        </span>
                        <Button asChild variant="outline">
                            <Link href={chat.index()}>
                                <MessageCircle className="size-4" aria-hidden />{' '}
                                Refresh
                            </Link>
                        </Button>
                    </div>
                </header>

                {rows.length === 0 ? (
                    <p className="border-y border-border py-10 text-muted-foreground">
                        No conversations yet. Turn the chat on in Clinic
                        settings and it will appear here as soon as somebody
                        uses it.
                    </p>
                ) : (
                    <ul className="divide-y divide-border border-y border-border">
                        {rows.map((row) => (
                            <li key={row.id}>
                                <Link
                                    href={chat.show(row.id).url}
                                    className="flex items-start gap-3 py-3 transition-colors duration-150 ease-out hover:bg-mist dark:hover:bg-white/5"
                                >
                                    <ChatAvatar
                                        name={row.name}
                                        side="visitor"
                                        className="size-9 text-xs"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2">
                                            <span className="truncate font-medium">
                                                {row.name}
                                            </span>
                                            {row.unread > 0 && (
                                                <span className="shrink-0 rounded-full bg-gold-deep px-1.5 py-0.5 text-xs font-medium text-white">
                                                    {row.unread}
                                                </span>
                                            )}
                                            {fresh.includes(row.id) && (
                                                <span className="shrink-0 text-xs font-medium text-green-700 dark:text-green-400">
                                                    new
                                                </span>
                                            )}
                                        </span>
                                        {/* Who spoke last. A preview reading "Yes,
                                            before 5pm" is ambiguous until you know
                                            which of you said it. */}
                                        <span className="mt-1 flex items-baseline gap-1.5 text-sm">
                                            <span
                                                className={`shrink-0 text-xs ${
                                                    row.last_from === 'visitor'
                                                        ? 'dark:text-plum-light font-medium text-plum'
                                                        : 'text-muted-foreground'
                                                }`}
                                            >
                                                {row.last_from === 'staff'
                                                    ? 'You'
                                                    : row.last_from ===
                                                        'visitor'
                                                      ? row.name.split(' ')[0]
                                                      : 'No messages'}
                                            </span>
                                            <span className="truncate text-muted-foreground">
                                                {row.preview ||
                                                    'No messages yet'}
                                            </span>
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-right text-xs text-muted-foreground">
                                        <span className="block">
                                            {row.at ? formatDate(row.at) : ''}
                                        </span>
                                        <span className="mt-1 block">
                                            {row.phone ?? 'No number'}
                                        </span>
                                        {row.page && (
                                            <span className="mt-1 block">
                                                {row.page}
                                            </span>
                                        )}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

ChatInbox.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Chat', href: chat.index() },
    ],
};
