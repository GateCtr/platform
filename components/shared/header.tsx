"use client";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";

export type HeaderVariant = "marketing" | "auth" | "dashboard" | "minimal";

export interface HeaderProps {
  variant?: HeaderVariant;
  rightSlot?: React.ReactNode;
  className?: string;
}

import { appUrl } from "@/lib/app-url";

type NavLink = {
  key: string;
  href: string;
  external?: boolean;
  highlight?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { key: "features", href: "/features" },
  { key: "pricing", href: "/pricing" },
  { key: "demo", href: "/demo", highlight: true },
  { key: "blog", href: "https://blog.gatectr.com", external: true },
  { key: "docs", href: "/docs" },
  { key: "changelog", href: "/changelog" },
];

function DesktopNav() {
  const t = useTranslations("common.nav");
  return (
    <nav className="hidden md:flex items-center gap-1">
      {NAV_LINKS.map(({ key, href, external, highlight }) =>
        external ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 transition-colors"
          >
            {t(key)}
          </a>
        ) : (
          <Link
            key={key}
            href={href}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              highlight
                ? "text-secondary-500 hover:text-secondary-500 hover:bg-secondary-500/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            {t(key)}
            {highlight && (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-secondary-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-secondary-500 leading-none">
                Live
              </span>
            )}
          </Link>
        ),
      )}
    </nav>
  );
}

function DesktopActions() {
  const t = useTranslations("common.nav");

  return (
    <div className="hidden md:flex items-center gap-1">
      <LanguageSwitcher />
      <ThemeToggle />
      <div className="w-px h-4 bg-border mx-1" aria-hidden />
      <Button variant="cta-ghost" size="sm" asChild>
        <a href={appUrl("/sign-in")}>{t("signIn")}</a>
      </Button>
      <Button variant="cta-primary" size="sm" asChild>
        <a href={appUrl("/sign-up")}>{t("signUp")}</a>
      </Button>
    </div>
  );
}

function MobileSheet() {
  const t = useTranslations("common.nav");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>
      <SheetContent side="right" className="w-72 p-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <SheetTitle asChild>
            <SheetClose asChild>
              <Link href="/" aria-label="GateCtr home">
                <Logo variant="full" />
              </Link>
            </SheetClose>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-3 py-4 gap-1">
          {NAV_LINKS.map(({ key, href, external, highlight }) =>
            external ? (
              <SheetClose key={key} asChild>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 transition-colors"
                >
                  {t(key)}
                </a>
              </SheetClose>
            ) : (
              <SheetClose key={key} asChild>
                <Link
                  href={href}
                  className={cn(
                    "px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                    highlight
                      ? "text-secondary-500 hover:bg-secondary-500/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  {t(key)}
                  {highlight && (
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-secondary-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-secondary-500 leading-none">
                      Live
                    </span>
                  )}
                </Link>
              </SheetClose>
            ),
          )}
        </nav>
        <div className="px-4 pb-6 mt-auto border-t border-border flex flex-col gap-2">
          <div className="flex items-center gap-2 py-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <Button variant="cta-secondary" size="sm" asChild className="w-full">
            <SheetClose asChild>
              <a href={appUrl("/sign-in")}>{t("signIn")}</a>
            </SheetClose>
          </Button>
          <Button variant="cta-primary" size="sm" asChild className="w-full">
            <SheetClose asChild>
              <a href={appUrl("/sign-up")}>{t("signUp")}</a>
            </SheetClose>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Header({
  variant = "marketing",
  rightSlot,
  className,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "w-full bg-background/80 backdrop-blur-sm sticky top-0 z-50 transition-[border-color,box-shadow] duration-200",
        scrolled
          ? "border-b border-border shadow-sm"
          : "border-b border-transparent",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center h-16 px-4 md:px-6",
          variant === "auth"
            ? "justify-center"
            : "justify-between max-w-7xl mx-auto",
        )}
      >
        <Link href="/" aria-label="GateCtr home">
          <Logo variant="full" />
        </Link>

        {variant === "marketing" && <DesktopNav />}

        {variant === "marketing" && (
          <>
            <DesktopActions />
            <MobileSheet />
          </>
        )}

        {(variant === "dashboard" || variant === "minimal") && (
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {rightSlot}
          </div>
        )}
      </div>
    </header>
  );
}
