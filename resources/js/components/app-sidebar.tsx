import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ExternalLink,
    LayoutGrid,
    ShoppingCart,
    UsersRound,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import Wordmark from '@/components/site/wordmark';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCan } from '@/lib/admin';
import { dashboard, home } from '@/routes';
import appointments from '@/routes/admin/appointments';
import leads from '@/routes/admin/leads';
import pos from '@/routes/admin/pos';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { clinic } = usePage().props;
    const can = useCan();

    const mainNavItems: NavItem[] = [
        { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
        ...(can('appointments.view')
            ? [
                  {
                      title: 'Appointments',
                      href: appointments.index(),
                      icon: CalendarDays,
                  },
              ]
            : []),
        ...(can('leads.view')
            ? [{ title: 'Leads', href: leads.index(), icon: UsersRound }]
            : []),
        ...(can('pos.view')
            ? [
                  {
                      title: 'Point of sale',
                      href: pos.index(),
                      icon: ShoppingCart,
                  },
              ]
            : []),
    ];

    const footerNavItems: NavItem[] = [
        { title: 'View website', href: home(), icon: ExternalLink },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={dashboard()}
                                prefetch
                                aria-label={`${clinic.short_name} dashboard`}
                            >
                                <Wordmark
                                    name={clinic.short_name}
                                    descriptor="Clinic desk"
                                    className="text-white [&_svg]:size-8 group-data-[collapsible=icon]:[&>span:last-child]:hidden"
                                />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
