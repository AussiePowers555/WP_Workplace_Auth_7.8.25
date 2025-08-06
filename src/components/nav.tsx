
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSessionStorage } from "@/hooks/use-session-storage"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"
import {
    Home,
    Briefcase,
    Bike,
    Banknote,
    FileText,
    Gem,
    Settings,
    MessageSquare,
    ClipboardCheck,
    Contact,
    Mail,
    LayoutGrid,
    Shield,
    Users,
} from "lucide-react"

const mainNavItems = [
    { href: "/", label: "Dashboard", icon: Home, adminOnly: false },
    { href: "/workspaces", label: "Workspaces", icon: LayoutGrid, adminOnly: true },
    { href: "/cases", label: "Case Management", icon: Briefcase, adminOnly: false },
    { href: "/fleet", label: "Fleet Tracking", icon: Bike, adminOnly: true },
    { href: "/financials", label: "Financials", icon: Banknote, adminOnly: true },
    { href: "/commitments", label: "Commitments", icon: ClipboardCheck, adminOnly: false },
    { href: "/contacts", label: "Contacts", icon: Contact, adminOnly: true },
    { href: "/documents", label: "Documents", icon: FileText, adminOnly: false },
    { href: "/interactions", label: "Interactions", icon: MessageSquare, adminOnly: false },
    { href: "/ai-email", label: "AI Email", icon: Mail, adminOnly: true },
    { href: "/users", label: "User Management", icon: Users, adminOnly: true },
]

const settingsNavItems = [
    { href: "/admin", label: "Admin Dashboard", icon: Shield, adminOnly: true },
    { href: "/subscriptions", label: "Subscriptions", icon: Gem, adminOnly: true },
    { href: "/settings", label: "Settings", icon: Settings, adminOnly: false },
]

export function Nav() {
    const [currentUser] = useSessionStorage<any>("currentUser", null);
    const { role } = useWorkspace();
    const isAdmin = role === "admin" || role === "developer";  // Developers have admin access
    const isWorkspaceUser = role === 'workspace_user';  // Only workspace_user role is restricted
    const pathname = usePathname()

    const rentalAgreementRegex = /^\/rental-agreement\/.*/;
    const isRentalAgreementPage = rentalAgreementRegex.test(pathname);
    const isFleetPage = pathname.startsWith('/fleet');

    return (
        <div className="flex h-full flex-col">
            <SidebarHeader>
                <Link href="/" className="flex items-center gap-2">
                    <Bike className="h-6 w-6 text-primary" />
                    <span className="text-lg font-semibold">PBikeRescue</span>
                </Link>
            </SidebarHeader>
            <SidebarContent className="flex-1">
                <SidebarMenu>
                    {mainNavItems
                        .filter(item => {
                            // Only workspace_user role has restrictions
                            if (isWorkspaceUser) {
                                return ['Case Management', 'Commitments', 'Documents'].includes(item.label);
                            }
                            // For admins and developers, show everything marked for admin
                            return !item.adminOnly || isAdmin;
                        })
                        .map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href || (item.href === "/fleet" && isRentalAgreementPage)}
                            >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                 <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarMenu>
                        {settingsNavItems
                            .filter(item => {
                                // Only workspace_user role has no settings access
                                if (isWorkspaceUser) {
                                    return false;
                                }
                                // For admins and developers, show admin items
                                return !item.adminOnly || isAdmin;
                            })
                            .map((item) => (
                             <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarFooter>
        </div>
    )
}
