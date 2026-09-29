import { Head, Link } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    at: string | null;
};

type Props = {
    conversations: { data: Row[]; links?: { url: string | null }[] };
    unread: number;
};

export default function ChatInbox({ conversations, unread }: Props) {
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
                            {unread > 0
                                ? ` ${unread} waiting on a reply.`
                                : ' Nothing waiting.'}
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={chat.index()}>
                            <MessageCircle className="size-4" aria-hidden />{' '}
                            Refresh
                        </Link>
                    </Button>
                </header>

                {conversations.data.length === 0 ? (
                    <p className="border-y border-border py-10 text-muted-foreground">
                        No conversations yet. Turn the chat on in Clinic
                        settings and it will appear here as soon as somebody
                        uses it.
                    </p>
                ) : (
                    <ul className="divide-y divide-border border-y border-border">
                        {conversations.data.map((row) => (
                            <li key={row.id}>
                                <Link
                                    href={chat.show(row.id).url}
                                    className="flex items-start justify-between gap-4 py-3 transition-colors duration-150 ease-out hover:bg-mist dark:hover:bg-white/5"
                                >
                                    <span className="min-w-0">
                                        <span className="flex items-center gap-2">
                                            <span className="truncate font-medium">
                                                {row.name}
                                            </span>
                                            {row.unread > 0 && (
                                                <span className="shrink-0 bg-gold-deep px-1.5 py-0.5 text-xs font-medium text-white">
                                                    {row.unread}
                                                </span>
                                            )}
                                        </span>
                                        <span className="mt-1 block truncate text-sm text-muted-foreground">
                                            {row.preview || 'No messages yet'}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-right text-xs text-muted-foreground">
                                        <span className="block">
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
