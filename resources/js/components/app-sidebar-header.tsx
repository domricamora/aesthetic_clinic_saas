import { Search } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { openPalette } from '@/components/admin/command-palette';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <button
                type="button"
                onClick={openPalette}
                className="ml-auto hidden h-9 items-center gap-2 border border-border bg-background px-3 text-sm text-muted-foreground transition-colors duration-150 ease-out hover:border-violet hover:text-foreground sm:flex"
            >
                <Search className="size-4" aria-hidden />
                Search
                <kbd className="ml-2 border border-border px-1.5 py-0.5 text-[11px] tracking-wide">
                    Ctrl K
                </kbd>
            </button>
        </header>
    );
}
