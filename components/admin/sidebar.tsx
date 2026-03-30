"use client";

/**
 * Admin Sidebar — uses shadcn Sidebar primitives, mirrors DashboardSidebar pattern.
 * Navigation filtered by permissions. Responsive via collapsible="icon".
 * Requirements: 6.4–6.7
 */

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { usePermissions } from "@/hooks/use-permissions";
import { useUser, useClerk } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/shared/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  ListOrdered,
  CreditCard,
  ShieldCheck,
  Flag,
  Activity,
  Building2,
  BarChart3,
  Bell,
  Megaphone,
  ChevronsUpDown,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAdminStore } from "@/lib/stores/admin-store";
import type { Permission } from "@/lib/permissions";

// ─── Nav structure ────────────────────────────────────────────────────────────

interface NavItem {
  key: string;
  href: string;
  permission: Permission;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  groupKey: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupKey: "groups.platform",
    items: [
      {
        key: "sidebar.overview",
        href: "/admin/overview",
        permission: "analytics:read",
        icon: LayoutDashboard,
      },
      {
        key: "sidebar.analytics",
        href: "/admin/analytics",
        permission: "analytics:read",
        icon: BarChart3,
      },
      {
        key: "sidebar.notifications",
        href: "/admin/notifications",
        permission: "analytics:read",
        icon: Bell,
      },
    ],
  },
  {
    groupKey: "groups.users",
    items: [
      {
        key: "sidebar.users",
        href: "/admin/users",
        permission: "users:read",
        icon: Users,
      },
      {
        key: "sidebar.teams",
        href: "/admin/teams",
        permission: "users:read",
        icon: Building2,
      },
      {
        key: "sidebar.waitlist",
        href: "/admin/waitlist",
        permission: "users:read",
        icon: ListOrdered,
      },
    ],
  },
  {
    groupKey: "groups.revenue",
    items: [
      {
        key: "sidebar.billing",
        href: "/admin/billing",
        permission: "billing:read",
        icon: CreditCard,
      },
    ],
  },
  {
    groupKey: "groups.security",
    items: [
      {
        key: "sidebar.auditLogs",
        href: "/admin/audit-logs",
        permission: "audit:read",
        icon: ShieldCheck,
      },
    ],
  },
  {
    groupKey: "groups.system",
    items: [
      {
        key: "sidebar.announcement",
        href: "/admin/announcement",
        permission: "system:read",
        icon: Megaphone,
      },
      {
        key: "sidebar.featureFlags",
        href: "/admin/feature-flags",
        permission: "system:read",
        icon: Flag,
      },
      {
        key: "sidebar.systemHealth",
        href: "/admin/system",
        permission: "system:read",
        icon: Activity,
      },
    ],
  },
];

// ─── User Menu ────────────────────────────────────────────────────────────────

function AdminUserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const t = useTranslations("adminShared.header");

  const name = user?.fullName ?? user?.firstName ?? "Admin";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const avatar = user?.imageUrl;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent hover:bg-sidebar-accent"
        >
          <Avatar className="size-7 shrink-0 rounded-md">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="text-[11px] font-semibold rounded-md">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 leading-none min-w-0">
            <span className="font-medium text-sm truncate">{name}</span>
            <span className="text-[11px] text-sidebar-foreground/50 truncate">
              {email}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-sidebar-foreground/40" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64"
        align="start"
        side="top"
        sideOffset={8}
      >
        {/* User header */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-border">
          <Avatar className="size-9 shrink-0 rounded-lg">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="text-xs font-semibold rounded-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-semibold truncate">{name}</span>
            <span className="text-[11px] text-muted-foreground truncate">
              {email}
            </span>
          </div>
        </div>

        <div className="py-1">
          <DropdownMenuItem asChild className="gap-2.5 mx-1 rounded-md">
            <Link href="/dashboard">
              <ExternalLink className="size-4 text-muted-foreground" />
              {t("backToApp")}
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        {/* Theme */}
        <div className="px-3 py-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            {t("theme")}
          </p>
          <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted">
            {(
              [
                { value: "light", icon: Sun, label: t("themeLight") },
                { value: "system", icon: Monitor, label: t("themeSystem") },
                { value: "dark", icon: Moon, label: t("themeDark") },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={[
                  "flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium transition-colors",
                  theme === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <Icon className="size-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="py-1">
          <DropdownMenuItem
            variant="destructive"
            className="gap-2.5 mx-1 rounded-md"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="size-4" />
            {t("signOut")}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function AdminSidebar() {
  const t = useTranslations("adminShared");
  const pathname = usePathname();
  const { data: permissions = [], isLoading } = usePermissions();
  const unacknowledgedCount = useAdminStore((s) => s.unacknowledgedCount);

  const cleanPath = pathname.replace(/^\/fr/, "") || "/";

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => permissions.includes(item.permission))
      .map((item) => {
        if (item.href === "/admin/notifications" && unacknowledgedCount > 0) {
          return { ...item, badge: String(unacknowledgedCount) };
        }
        return item;
      }),
  })).filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border pb-0">
        <div className="flex h-14 items-center px-3">
          <div className="group-data-[collapsible=icon]:hidden">
            <Logo
              variant="full"
              iconClassName="w-6 h-6"
              textClassName="text-xl"
            />
          </div>
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
            <Logo variant="icon" iconClassName="w-6 h-6" />
          </div>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="overflow-y-auto overflow-x-hidden scrollbar-none">
        {isLoading ? (
          <div className="flex flex-col gap-1 p-3 pt-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : (
          visibleGroups.map((group, idx) => (
            <div key={group.groupKey}>
              {idx > 0 && <SidebarSeparator className="mx-3 my-1" />}
              <SidebarGroup className={idx === 0 ? "pt-3" : "pt-1"}>
                <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
                  {t(group.groupKey as Parameters<typeof t>[0])}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        cleanPath === item.href ||
                        cleanPath.startsWith(`${item.href}/`);
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={t(item.key as Parameters<typeof t>[0])}
                            className="gap-3 rounded-md h-9"
                          >
                            <Link
                              href={
                                item.href as Parameters<typeof Link>[0]["href"]
                              }
                            >
                              <Icon className="size-4 shrink-0" />
                              <span>
                                {t(item.key as Parameters<typeof t>[0])}
                              </span>
                              {item.badge && (
                                <Badge
                                  variant="secondary"
                                  className="ml-auto text-xs px-1.5 py-0"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          ))
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <AdminUserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="hidden md:flex items-center justify-end px-1 pb-1">
          <SidebarTrigger className="size-7 text-muted-foreground/50 hover:text-muted-foreground" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
