import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = {
    children: ReactNode;
    variant?: AppVariant;
};

export function AppShell({ children, variant = 'sidebar' }: Props) {
    const isOpen = usePage().props.sidebarOpen;

    // Marks the whole backend, so the stylesheet can tell it apart from the
    // marketing site without either of them having to say so in every file.
    if (variant === 'header') {
        return (
            <div
                data-shell="admin"
                className="flex min-h-screen w-full flex-col"
            >
                {children}
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen} data-shell="admin">
            {children}
        </SidebarProvider>
    );
}
