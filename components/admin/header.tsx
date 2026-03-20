"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRoles } from "@/hooks/use-roles";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/routing";
import {
  ShieldAlert,
  LayoutDashboard,
  Bell,
  ExternalLink,
  LogOut,
  Search,
  Settings,
  ChevronDown,
} from "lucide-react";
import type { RoleName } from "@/lib/permissions";

// ─── Route → label key ────────────────────────────────────────────────────────

const ADMIN_ROUTES: Record<string, string> = {
  "/admin/overview":      "sidebar.overview",
  "/admin/users":         "sidebar.users",
  "/admin/waitlist":      "sidebar.waitlist",
  "/admin/billing":       "sidebar.billing",
  "/admin/audit-logs":    "sidebar.auditLogs",
  "/admin/feature-flags": "sidebar.featureFlags",
  "/admin/system":        "sidebar.systemHealth",
};

function useAdminBreadcrumb() {
  const pathname = usePathname();
  const clean = pathname.replace(/^\/fr/, "") || "/";
  return (
    Object.entries(ADMIN_ROUTES)
      .filter(([route]) => clean === route || clean.startsWith(`${route}/`))
      .sort((a, b) => b[0].length - a[0].length)[0] ?? null
  );
}

// ─── Role styling ─────────────────────────────────────────────────────────────

const ROLE_PRIORITY: RoleName[] = [
  "SUPER_ADMIN", "ADMIN", "MANAGER", "SUPPORT", "DEVELOPER", "VIEWER",
];

const ROLE_STYLE: Record<RoleName, string> = {
  SUPER_ADMIN: "bg-primary/10 text-primary border-primary/25",
  ADMIN:       "bg-violet-500/10 text-violet-600 border-violet-500/25 dark:text-violet-400",
  MANAGER:     "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400",
  SUPPORT:     "bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-400",
  DEVELOPER:   "bg-muted text-muted-foreground border-border",
  VIEWER:      "bg-muted text-muted-foreground border-border",
};

// ─── Search trigger ───────────────────────────────────────────────────────────

function SearchTrigger() {
  const t = useTranslations("adminShared.header");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex h-8 w-48 justify-between gap-2 text-muted-foreground text-xs font-normal px-3 border-border/60 bg-muted/40 hover:bg-muted"
          aria-label={t("search")}
        >
          <span className="flex items-center gap-2">
            <Search className="size-3.5 shrink-0" />
            {t("search")}
          </span>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-background px-1 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{t("search")}</TooltipContent>
    </Tooltip>
  );
}

// ─── User menu ────────────────────────────────────────────────────────────────

function AdminUserMenu({ displayRole }: { displayRole: RoleName | null }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const t = useTranslations("adminShared");

  if (!isLoaded) {
    return <Skeleton className="size-8 rounded-full" />;
  }

  const name    = user?.fullName ?? user?.firstName ?? "Admin";
  const email   = user?.primaryEmailAddress?.emailAddress ?? "";
  const avatar  = user?.imageUrl;
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const roleLabel = displayRole ? t(`roles.${displayRole}` as Parameters<typeof t>[0]) : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="User menu"
        >
          <Avatar className="size-6 rounded-full shrink-0">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="text-[10px] font-bold">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
            {name}
          </span>
          <ChevronDown className="size-3 text-muted-foreground shrink-0 hidden md:block" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
        {/* Identity block */}
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar className="size-10 rounded-lg shrink-0">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="text-sm font-bold rounded-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-semibold truncate">{name}</span>
            <span className="text-[11px] text-muted-foreground truncate">{email}</span>
            {roleLabel && (
              <Badge
                variant="outline"
                className={`mt-0.5 w-fit h-4 px-1.5 text-[9px] font-semibold uppercase tracking-wider gap-1 ${displayRole ? ROLE_STYLE[displayRole] : ""}`}
              >
                <ShieldAlert className="size-2.5 shrink-0" />
                {roleLabel}
              </Badge>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 py-1.5">
          {t("header.navigation")}
        </DropdownMenuLabel>

        <DropdownMenuItem asChild className="gap-2.5 mx-1 rounded-md">
          <Link href="/dashboard">
            <LayoutDashboard className="size-4 text-muted-foreground" />
            {t("header.backToApp")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="gap-2.5 mx-1 rounded-md">
          <Link href="/dashboard">
            <Settings className="size-4 text-muted-foreground" />
            {t("header.settings")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="gap-2.5 mx-1 rounded-md">
          <a href="https://docs.gatectr.com" target="_blank" rel="noreferrer">
            <ExternalLink className="size-4 text-muted-foreground" />
            {t("header.docs")}
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="py-1">
          <DropdownMenuItem
            variant="destructive"
            className="gap-2.5 mx-1 rounded-md"
            onClick={() => signOut()}
          >
            <LogOut className="size-4" />
            {t("header.signOut")}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main header ──────────────────────────────────────────────────────────────

export function AdminHeader() {
  const t = useTranslations("adminShared");
  const breadcrumb = useAdminBreadcrumb();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();

  const displayRole = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;

  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 backdrop-blur-sm px-4 sticky top-0 z-10">

        {/* Mobile sidebar trigger — opens sheet drawer on small screens */}
        <div className="md:hidden">
          <SidebarTrigger />
        </div>

        {/* Breadcrumb */}
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem className="hidden sm:flex items-center gap-1.5">
              <ShieldAlert className="size-3.5 text-muted-foreground/50 shrink-0" />
              <BreadcrumbLink asChild>
                <Link href="/admin/overview" className="text-muted-foreground/70 hover:text-foreground text-sm">
                  Admin
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {breadcrumb && (
              <>
                <BreadcrumbSeparator className="hidden sm:flex" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium text-sm truncate max-w-[180px]">
                    {t(breadcrumb[1] as Parameters<typeof t>[0])}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-1">

          {/* Search */}
          <SearchTrigger />

          <Separator orientation="vertical" className="h-5 mx-1 hidden md:block shrink-0" />

          {/* Role badge */}
          {rolesLoading ? (
            <Skeleton className="hidden sm:block h-6 w-20 rounded-full" />
          ) : displayRole ? (
            <Badge
              variant="outline"
              className={`hidden sm:flex h-6 px-2 text-[10px] font-semibold uppercase tracking-wider gap-1 shrink-0 ${ROLE_STYLE[displayRole]}`}
            >
              <ShieldAlert className="size-3 shrink-0" />
              {t(`roles.${displayRole}` as Parameters<typeof t>[0])}
            </Badge>
          ) : null}

          <Separator orientation="vertical" className="h-5 mx-1 hidden sm:block shrink-0" />

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 relative shrink-0"
                aria-label={t("header.notifications")}
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-secondary-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t("header.notifications")}</TooltipContent>
          </Tooltip>

          <LanguageSwitcher />
          <ThemeToggle />

          <Separator orientation="vertical" className="h-5 mx-1 shrink-0" />

          {/* User menu */}
          <AdminUserMenu displayRole={displayRole} />
        </div>
      </header>
    </TooltipProvider>
  );
}
