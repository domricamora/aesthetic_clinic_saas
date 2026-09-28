import { Link, usePage } from '@inertiajs/react';
import {
    BookIcon,
    CalendarDays,
    ExternalLink,
    LayoutGrid,
    ShoppingCart,
    UsersIcon,
    UsersRound,
    WalletIcon,
    Warehouse,
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
import accounting from '@/routes/admin/accounting';
import hr from '@/routes/admin/hr';
import inventory from '@/routes/admin/inventory';
import payroll from '@/routes/admin/payroll';
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
        ...(can('hr.view')
            ? [
                  {
                      title: 'Staff',
                      href: hr.index(),
                      icon: UsersIcon,
                  },
                  {
                      title: 'Payroll',
                      href: payroll.index(),
                      icon: WalletIcon,
                  },
              ]
            : []),
        ...(can('accounting.view')
            ? [
                  {
                      title: 'Accounting',
                      href: accounting.index(),
                      icon: BookIcon,
                  },
              ]
            : []),
        ...(can('inventory.view')
            ? [
                  {
                      title: 'Inventory',
                      href: inventory.index(),
                      icon: Warehouse,
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
