"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserRound,
  Building2,
  Users,
  KeySquare,
  Cpu,
  ShieldCheck,
  Bell,
  Lock,
  CreditCard,
} from "lucide-react";

const NAV_ITEMS = [
  {
    group: "account",
    items: [
      { key: "profile", href: "/settings/profile", icon: UserRound },
      { key: "security", href: "/settings/security", icon: Lock },
    ],
  },
  {
    group: "workspace",
    items: [
      { key: "workspace", href: "/settings/workspace", icon: Building2 },
      { key: "team", href: "/settings/team", icon: Users },
    ],
  },
  {
    group: "platform",
    items: [
      { key: "providers", href: "/settings/providers", icon: Cpu },
      { key: "apiKeys", href: "/settings/api-keys", icon: KeySquare },
      { key: "budget", href: "/settings/budget", icon: ShieldCheck },
      { key: "notifications", href: "/settings/notifications", icon: Bell },
      { key: "billing", href: "/settings/billing", icon: CreditCard },
    ],
  },
] as const;

type NavItem = { key: string; href: string; icon: React.ElementType };
const ALL_ITEMS: NavItem[] = NAV_ITEMS.flatMap((g) => [...g.items]);

// ─── Mobile select ────────────────────────────────────────────────────────────

function MobileNav({ clean }: { clean: string }) {
  const t = useTranslations("settings");
  const router = useRouter();
  const current = ALL_ITEMS.find(
    (item) => clean === item.href || clean.startsWith(item.href + "/")
  );

  return (
    <div className="md:hidden border-b border-border bg-background px-4 py-3">
      <Select
        value={current?.href ?? "/settings/profile"}
        onValueChange={(href) => router.push(href as Parameters<typeof router.push>[0])}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {NAV_ITEMS.map(({ group, items }) => (
            <div key={group}>
              <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {t(`navGroups.${group}`)}
              </p>
              {items.map(({ key, href }) => (
                <SelectItem key={key} value={href}>
                  {t(`nav.${key}`)}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Desktop sidebar ──────────────────────────────────────────────────────────

function DesktopNav({ clean }: { clean: string }) {
  const t = useTranslations("settings");

  return (
    <aside className="hidden md:flex w-52 shrink-0 border-r border-border bg-background flex-col py-4 overflow-y-auto">
      {NAV_ITEMS.map(({ group, items }) => (
        <div key={group} className="mb-4">
          <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {t(`navGroups.${group}`)}
          </p>
          <nav className="flex flex-col gap-0.5 px-2">
            {items.map(({ key, href, icon: Icon }) => {
              const isActive = clean === href || clean.startsWith(href + "/");
              return (
                <Link
                  key={key}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {t(`nav.${key}`)}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function SettingsSidebar() {
  const pathname = usePathname();
  const clean = pathname.replace(/^\/fr/, "");

  return (
    <>
      <MobileNav clean={clean} />
      <DesktopNav clean={clean} />
    </>
  );
}
