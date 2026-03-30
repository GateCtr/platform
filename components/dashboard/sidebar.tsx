"use client";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/shared/logo";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useActiveTeam } from "@/hooks/use-active-team";
import { CreateWorkspaceModal } from "@/components/dashboard/create-workspace-modal";
import {
  LayoutDashboard,
  LineChart,
  Boxes,
  Receipt,
  SlidersHorizontal,
  ChevronsUpDown,
  LogOut,
  UserRound,
  Plus,
  Check,
  Sun,
  Moon,
  Monitor,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { RoleName } from "@/lib/permissions";

const SYSTEM_ROLES: RoleName[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SUPPORT"];

function useIsSystemUser() {
  const { data } = useQuery<{ roles: RoleName[] }>({
    queryKey: ["user-roles"],
    queryFn: () => fetch("/api/auth/roles").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });
  return data?.roles?.some((r) => SYSTEM_ROLES.includes(r)) ?? false;
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const MAIN_NAV = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "analytics", href: "/analytics", icon: LineChart },
  { key: "projects", href: "/projects", icon: Boxes },
] as const;

const SECONDARY_NAV = [
  { key: "billing", href: "/billing", icon: Receipt },
  { key: "settings", href: "/settings", icon: SlidersHorizontal },
] as const;

// ─── Team Switcher ────────────────────────────────────────────────────────────

function TeamSwitcher() {
  const t = useTranslations("dashboard.sidebar");
  const { activeTeam, isLoading, teams, switchTeam } = useActiveTeam();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const orgName = activeTeam?.name ?? "…";
  const planLabel = activeTeam?.plan?.toLowerCase() ?? "free";
  const initials = orgName === "…" ? "…" : orgName.slice(0, 2).toUpperCase();
  const userPlan = activeTeam?.plan?.toUpperCase() ?? "FREE";
  const avatarUrl = activeTeam?.avatarUrl ?? null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            translate="no"
            suppressHydrationWarning
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <div
              className="flex size-8 shrink-0 rounded-md overflow-hidden bg-primary text-primary-foreground text-xs font-bold select-none items-center justify-center"
              translate="no"
            >
              {isLoading ? (
                "…"
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={orgName}
                  className="size-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div
              className="flex flex-col gap-0.5 leading-none min-w-0"
              translate="no"
              suppressHydrationWarning
            >
              <span className="font-semibold text-sm truncate text-sidebar-foreground">
                {isLoading ? t("loading") : orgName}
              </span>
              <span className="text-[11px] text-sidebar-foreground/50 truncate capitalize">
                {planLabel} {t("plan")}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-sidebar-foreground/40" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-64"
          align="start"
          side="bottom"
          sideOffset={8}
        >
          <div className="px-3 pt-2.5 pb-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {t("workspaces")}
            </p>
          </div>

          <div className="px-1 pb-1">
            {teams.map((team) => {
              const isActive = activeTeam?.id === team.id;
              const teamInitials = team.name.slice(0, 2).toUpperCase();
              return (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => switchTeam(team.id)}
                  className="gap-2.5 rounded-md px-2 py-2 cursor-pointer"
                >
                  <div
                    className={[
                      "flex size-7 shrink-0 rounded-md overflow-hidden text-[11px] font-bold items-center justify-center",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {team.avatarUrl ? (
                      <img
                        src={team.avatarUrl}
                        alt={team.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      teamInitials
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {team.name}
                    </span>
                    {isActive && activeTeam?.plan && (
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {activeTeam.plan.toLowerCase()} {t("plan")}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <Check className="size-3.5 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator />

          <div className="px-1 py-1">
            <DropdownMenuItem
              className="gap-2.5 rounded-md px-2 py-2 text-muted-foreground cursor-pointer"
              onClick={() => setShowCreateModal(true)}
            >
              <div className="flex size-7 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 shrink-0">
                <Plus className="size-3.5" />
              </div>
              <span className="text-sm">{t("newWorkspace")}</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userPlan={userPlan}
      />
    </>
  );
}

// ─── User Menu ────────────────────────────────────────────────────────────────

function UserMenu() {
  const t = useTranslations("dashboard.sidebar");
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const isSystemUser = useIsSystemUser();

  const name = user?.fullName ?? user?.firstName ?? "User";
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
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Avatar className="size-7 shrink-0 rounded-md">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="text-[11px] font-semibold rounded-md">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 leading-none min-w-0">
            <span className="font-medium text-sm truncate text-sidebar-foreground">
              {name}
            </span>
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
        {/* User header — non-interactive */}
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

        {/* Navigation items */}
        <div className="py-1">
          <DropdownMenuItem asChild className="gap-2.5 mx-1 rounded-md">
            <Link href="/settings/profile">
              <UserRound className="size-4 text-muted-foreground" />
              {t("profile")}
            </Link>
          </DropdownMenuItem>
          {isSystemUser && (
            <>
              <DropdownMenuItem asChild className="gap-2.5 mx-1 rounded-md">
                <Link href="/admin/overview">
                  <ShieldAlert className="size-4 text-muted-foreground" />
                  {t("admin")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="gap-2.5 mx-1 rounded-md text-muted-foreground"
              >
                <a href="/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  {t("viewSite")}
                </a>
              </DropdownMenuItem>
            </>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Theme switcher */}
        <div className="px-3 py-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            {t("theme")}
          </p>
          <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted">
            {(
              [
                { value: "light", icon: Sun },
                { value: "system", icon: Monitor },
                { value: "dark", icon: Moon },
              ] as const
            ).map(({ value, icon: Icon }) => (
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
                <span className="capitalize">{value}</span>
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Sign out */}
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

export function DashboardSidebar() {
  const t = useTranslations("dashboard.sidebar");
  const pathname = usePathname();

  const cleanPath = pathname.replace(/^\/fr/, "") || "/";

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border pb-0">
        {/* Logo — full in expanded, icon-only when collapsed */}
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

        {/* Team switcher */}
        <SidebarMenu className="px-1 pb-2">
          <SidebarMenuItem>
            <TeamSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content — no visible scrollbar */}
      <SidebarContent className="overflow-y-auto overflow-x-hidden scrollbar-none">
        {/* Main nav */}
        <SidebarGroup className="pt-3">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
            {t("main")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV.map(({ key, href, icon: Icon }) => {
                const isActive =
                  cleanPath === href ||
                  (href !== "/dashboard" && cleanPath.startsWith(href));
                return (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={t(key)}
                      className="gap-3 rounded-md h-9"
                    >
                      <Link href={href}>
                        <Icon className="size-4 shrink-0" />
                        <span>{t(key)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-3 my-1" />

        {/* Account nav */}
        <SidebarGroup className="pb-3">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
            {t("account")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY_NAV.map(({ key, href, icon: Icon }) => (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton
                    asChild
                    isActive={cleanPath.startsWith(href)}
                    tooltip={t(key)}
                    className="gap-3 rounded-md h-9"
                  >
                    <Link href={href}>
                      <Icon className="size-4 shrink-0" />
                      <span className="text-sm">{t(key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — user menu + collapse trigger */}
      <SidebarFooter className="border-t border-sidebar-border pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Collapse trigger — desktop only, positioned at bottom like Linear/Vercel */}
        <div className="hidden md:flex items-center justify-end px-1 pb-1">
          <SidebarTrigger className="size-7 text-muted-foreground/50 hover:text-muted-foreground" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
