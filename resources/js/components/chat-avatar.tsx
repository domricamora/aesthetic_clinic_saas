import { cn } from '@/lib/utils';

/**
 * Who is speaking, as a small circle.
 *
 * A chat with no faces is two columns of text and no way to tell at a glance
 * who said what once a thread is long. Initials from a name beat an icon when
 * there is a name, and a photo beats both when there is one.
 */
export function ChatAvatar({
    name,
    photo,
    side,
    className,
}: {
    name: string | null;
    photo?: string | null;
    /** Whose side they are on, which decides the tint. */
    side: 'visitor' | 'staff';
    className?: string;
}) {
    const label = name?.trim();

    const initials = label
        ? label
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? '')
              .join('')
        : '';

    return (
        <span
            className={cn(
                'flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-medium',
                side === 'staff'
                    ? 'bg-plum text-white'
                    : 'bg-mist text-muted-foreground dark:bg-white/10',
                className,
            )}
            title={label ?? undefined}
        >
            {photo ? (
                <img src={photo} alt="" className="size-full object-cover" />
            ) : initials ? (
                initials
            ) : (
                // Nobody has said who they are yet, which is the normal case
                // for the first few messages of a chat.
                <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden
                >
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
                </svg>
            )}
        </span>
    );
}
