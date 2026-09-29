import { MessageCircle, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Message = { from: string; body: string; at: string };

const TOKEN_KEY = 'patrice.chat';

const token = (): string => {
    let existing = window.localStorage.getItem(TOKEN_KEY);

    if (!existing) {
        existing = crypto.randomUUID();
        window.localStorage.setItem(TOKEN_KEY, existing);
    }

    return existing;
};

/**
 * The chat window.
 *
 * The visitor is identified by a token in this browser rather than an
 * account: asking whether a treatment hurts should not require registering
 * first. Nothing is sent until somebody types, so merely loading a page does
 * not create a conversation the front desk then has to close.
 */
export function ChatWidget() {
    const [enabled, setEnabled] = useState(false);
    const [greeting, setGreeting] = useState('');
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [asked, setAsked] = useState(false);
    const [body, setBody] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [sending, setSending] = useState(false);
    const log = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/chat/status')
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!data?.enabled) return;
                setEnabled(true);
                setGreeting(data.greeting ?? '');
            })
            .catch(() => undefined);
    }, []);

    const pull = useCallback(async () => {
        const response = await fetch(`/chat/${token()}`).catch(() => null);
        if (!response?.ok) return;
        const data = await response.json();
        setMessages(data.messages ?? []);
        setAsked(Boolean(data.asked));
    }, []);

    useEffect(() => {
        if (!open || !enabled) return;
        void pull();
        const timer = setInterval(pull, 5000);
        return () => clearInterval(timer);
    }, [open, enabled, pull]);

    useEffect(() => {
        log.current?.scrollTo({ top: log.current.scrollHeight });
    }, [messages]);

    const send = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!body.trim() || sending) return;

        setSending(true);
        setBody('');

        const response = await fetch(`/chat/${token()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                body,
                name: name || null,
                phone: phone || null,
                page: window.location.pathname,
            }),
        }).catch(() => null);

        setSending(false);
        if (response?.ok) {
            setAsked(true);
            void pull();
        }
    };

    if (!enabled) return null;

    return (
        <>
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="press fixed right-4 bottom-4 z-50 inline-flex items-center gap-2 bg-plum px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-plum-deep"
                >
                    <MessageCircle className="size-4" aria-hidden /> Chat
                </button>
            )}

            {open && (
                <div className="fixed right-4 bottom-4 z-50 flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col border border-border bg-background shadow-xl">
                    <div className="flex items-center justify-between bg-plum px-4 py-3 text-white">
                        <p className="text-sm font-medium">{greeting}</p>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Close chat"
                        >
                            <X className="size-4" aria-hidden />
                        </button>
                    </div>

                    <div
                        ref={log}
                        className="flex-1 space-y-2 overflow-y-auto p-3"
                        aria-live="polite"
                    >
                        {messages.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Ask us anything about treatments, prices or
                                opening hours.
                            </p>
                        )}
                        {messages.map((m, i) => (
                            <p
                                key={i}
                                className={
                                    m.from === 'staff'
                                        ? 'ml-auto max-w-[85%] bg-plum px-3 py-2 text-sm text-white'
                                        : 'max-w-[85%] bg-mist px-3 py-2 text-sm dark:bg-white/10'
                                }
                            >
                                {m.body}
                            </p>
                        ))}
                    </div>

                    {!asked && (
                        <div className="grid gap-2 border-t border-border p-3">
                            <p className="text-xs text-muted-foreground">
                                Leave your name and number and we can reply.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Name"
                                    aria-label="Your name"
                                    className="border border-border bg-transparent px-2 py-1.5 text-sm"
                                />
                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Mobile"
                                    aria-label="Your mobile number"
                                    className="border border-border bg-transparent px-2 py-1.5 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    <form
                        onSubmit={send}
                        className="flex gap-2 border-t border-border p-3"
                    >
                        <label htmlFor="chat-body" className="sr-only">
                            Message
                        </label>
                        <input
                            id="chat-body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Type a message"
                            maxLength={2000}
                            className="flex-1 border border-border bg-transparent px-2 py-1.5 text-sm"
                        />
                        <button
                            type="submit"
                            disabled={sending || !body.trim()}
                            aria-label="Send"
                            className="bg-plum px-3 text-white disabled:opacity-50"
                        >
                            <Send className="size-4" aria-hidden />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
