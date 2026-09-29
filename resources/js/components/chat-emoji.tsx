import { Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * A small, fixed set rather than a full picker library.
 *
 * Most emoji pickers are several hundred kilobytes and a data grid of symbols
 * that nobody in a clinic conversation reaches for. These are the ones a
 * front desk actually sends -- a smile, a thank you, a booking, an apology --
 * and the panel closes on Escape or a click outside so it never sits over a
 * conversation.
 */
const EMOJI = [
    '😀',
    '😊',
    '🙂',
    '😉',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😋',
    '😎',
    '🤩',
    '🥳',
    '🤗',
    '🤔',
    '🤨',
    '😐',
    '😴',
    '😢',
    '😭',
    '😤',
    '😡',
    '🥺',
    '😱',
    '😰',
    '👍',
    '👎',
    '👌',
    '🙏',
    '👏',
    '💪',
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '✨',
    '🎉',
    '🎁',
    '💐',
    '🌸',
    '⭐',
    '✅',
    '❌',
    '⚠️',
    '❓',
    '💬',
    '📞',
    '📅',
    '⏰',
    '💰',
    '💳',
    '🧾',
    '📍',
    '☕',
    '🍵',
    '🥗',
    '💊',
    '🩺',
    '🧴',
];

export function ChatEmoji({
    onPick,
    disabled,
}: {
    onPick: (emoji: string) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const panel = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        const onClick = (event: MouseEvent) => {
            if (!panel.current?.contains(event.target as Node)) setOpen(false);
        };

        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onClick);

        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onClick);
        };
    }, [open]);

    return (
        <div className="relative shrink-0" ref={panel}>
            <button
                type="button"
                onClick={() => setOpen((was) => !was)}
                disabled={disabled}
                aria-label="Add an emoji"
                aria-expanded={open}
                className="flex h-full items-center px-2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
                <Smile className="size-4" aria-hidden />
            </button>

            {open && (
                <div className="absolute right-0 bottom-full z-20 mb-2 grid w-56 grid-cols-8 gap-0.5 rounded-lg border border-border bg-background p-2 shadow-xl">
                    {EMOJI.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                                onPick(emoji);
                                setOpen(false);
                            }}
                            className="flex size-6 items-center justify-center text-base transition-colors duration-100 hover:bg-mist dark:hover:bg-white/10"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
