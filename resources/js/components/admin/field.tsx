import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';

/** Shared look for admin inputs, selects and textareas. */
export const control =
    'block h-10 w-full border border-input bg-background px-3 text-sm outline-none transition-colors duration-150 ease-out focus:border-violet aria-invalid:border-destructive';

export default function Field({
    label,
    htmlFor,
    error,
    hint,
    className,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    hint?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <label htmlFor={htmlFor} className="text-sm font-medium">
                {label}
                {hint && (
                    <span className="ml-1 font-normal text-muted-foreground">
                        {hint}
                    </span>
                )}
            </label>
            {children}
            <InputError message={error} />
        </div>
    );
}
