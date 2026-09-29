import { Head, Link, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCheck } from 'lucide-react';
import { ChatAvatar } from '@/components/chat-avatar';
import { ChatEmoji } from '@/components/chat-emoji';
import { usePoll } from '@/hooks/use-poll';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/admin';
import { dashboard } from '@/routes';
import chat from '@/routes/admin/chat';

type Message = {
    from: string;
    body: string;
    who: string | null;
    at: string;
};

type Props = {
    conversation: {
        id: number;
        name: string;
        phone: string | null;
        page: string | null;
        lead_id: number | null;
    };
    messages: Message[];
};

export default function ChatThread({ conversation, messages }: Props) {
    const reply = useForm({ body: '' });
    const replyField = useRef<HTMLTextAreaElement>(null);
    const log = useRef<HTMLOListElement>(null);
    const [thread, setThread] = useState(messages);

    /** Inserts at the caret so an emoji lands mid-sentence, not at the end. */
    const insertEmoji = (emoji: string) => {
        const area = replyField.current;
        const at = area?.selectionStart ?? reply.data.body.length;
        reply.setData(
            'body',
            reply.data.body.slice(0, at) + emoji + reply.data.body.slice(at),
        );

        requestAnimationFrame(() => {
            area?.focus();
            area?.setSelectionRange(at + emoji.length, at + emoji.length);
        });
    };
    const close = useForm({});

    // A reply comes back through Inertia, which remounts this page with fresh
    // props. Without this the list would keep showing the message as pending
    // until the next poll noticed it.
    useEffect(() => {
        setThread(messages);
    }, [messages]);

    // Scroll to the newest message, but only if the desk was already at the
    // bottom. Yanking somebody down while they are reading further up is worse
    // than making them scroll.
    const atBottom = () => {
        const el = log.current;
        return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };

    const jumpToBottom = () => {
        const el = log.current;
        if (el) el.scrollTop = el.scrollHeight;
    };

    const pull = useCallback((data: { messages: Message[] }) => {
        setThread((current) => {
            // Only follow along if the arrival is from the visitor. Their own
            // message appearing under the cursor mid-sentence would be
            // disruptive, and it is usually a staff member replying.
            const fromVisitor = data.messages.some(
                (m) =>
                    m.from === 'visitor' && m.at > (current.at(-1)?.at ?? ''),
            );

            if (fromVisitor && atBottom()) {
                requestAnimationFrame(jumpToBottom);
            }

            return data.messages;
        });
    }, []);

    usePoll<{ messages: Message[] }>(
        chat.messages(conversation.id).url,
        pull,
        5000,
    );

    // Open on the newest, not the oldest.
    useEffect(jumpToBottom, []);

    return (
        <>
            <Head title={`Chat with ${conversation.name}`} />
            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <Link
                            href={chat.index()}
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" aria-hidden /> All
                            conversations
                        </Link>
                        <h1 className="mt-2 font-display text-3xl">
                            {conversation.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {conversation.phone ?? 'No number given'}
                            {conversation.page
                                ? ` · was on ${conversation.page}`
                                : ''}
                        </p>
                    </div>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            close.post(chat.close(conversation.id).url);
                        }}
                    >
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={close.processing}
                        >
                            <CheckCheck className="size-4" aria-hidden /> Mark
                            as dealt with
                        </Button>
                    </form>
                </header>

                <ol
                    ref={log}
                    className="flex flex-1 flex-col gap-3 overflow-y-auto"
                >
                    {thread.map((message, i) => {
                        const staff = message.from === 'staff';

                        return (
                            <li
                                key={i}
                                className={
                                    staff
                                        ? 'ml-auto flex max-w-2xl items-end gap-2'
                                        : 'flex max-w-2xl items-end gap-2'
                                }
                            >
                                {!staff && (
                                    <ChatAvatar
                                        name={conversation.name}
                                        side="visitor"
                                    />
                                )}
                                <div
                                    className={
                                        staff
                                            ? 'rounded-2xl rounded-br-sm bg-plum px-4 py-2 text-white'
                                            : 'rounded-2xl rounded-bl-sm bg-mist px-4 py-2 dark:bg-white/5'
                                    }
                                >
                                    {staff && message.who && (
                                        <p className="mb-0.5 text-xs font-medium text-white/70">
                                            {message.who}
                                        </p>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap">
                                        {message.body}
                                    </p>
                                    <p
                                        className={
                                            staff
                                                ? 'mt-1 text-right text-xs text-white/60'
                                                : 'mt-1 text-xs text-muted-foreground'
                                        }
                                    >
                                        {message.who ?? conversation.name} ·{' '}
                                        {formatDate(message.at, {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                {staff && (
                                    <ChatAvatar
                                        name={message.who ?? 'Staff'}
                                        side="staff"
                                    />
                                )}
                            </li>
                        );
                    })}
                </ol>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        reply.post(chat.reply(conversation.id).url, {
                            preserveScroll: true,
                            onSuccess: () => reply.reset(),
                        });
                    }}
                    className="max-w-2xl space-y-2"
                >
                    <label htmlFor="reply" className="sr-only">
                        Reply
                    </label>
                    <div className="flex items-end gap-2">
                        <Textarea
                            id="reply"
                            rows={3}
                            ref={replyField}
                            value={reply.data.body}
                            onChange={(e) =>
                                reply.setData('body', e.target.value)
                            }
                            placeholder="Type a reply..."
                            maxLength={2000}
                        />
                        <ChatEmoji
                            onPick={insertEmoji}
                            disabled={reply.processing}
                        />
                    </div>
                    {reply.errors.body && (
                        <p className="text-sm text-destructive">
                            {reply.errors.body}
                        </p>
                    )}
                    <Button
                        type="submit"
                        disabled={reply.processing || !reply.data.body.trim()}
                    >
                        {reply.processing ? (
                            <>
                                <Spinner /> Sending...
                            </>
                        ) : (
                            'Send reply'
                        )}
                    </Button>
                </form>
            </div>
        </>
    );
}

ChatThread.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Chat', href: chat.index() },
    ],
};
