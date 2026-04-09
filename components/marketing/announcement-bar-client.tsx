"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import type { AnnouncementConfig } from "@/lib/announcement-types";

const DISMISS_KEY = "gatectr_announcement_dismissed";

const VARIANT_STYLES: Record<string, string> = {
  info: "bg-secondary-500/10 border-secondary-500/20 text-secondary-600 dark:text-secondary-400",
  warning:
    "bg-warning-500/10 border-warning-500/20 text-warning-600 dark:text-warning-400",
  success:
    "bg-success-500/10 border-success-500/20 text-success-600 dark:text-success-400",
  promo:
    "bg-linear-to-r from-primary/10 via-secondary-500/10 to-primary/10 border-primary/20 text-foreground",
};

const CTA_STYLES: Record<string, string> = {
  info: "underline underline-offset-2 hover:text-secondary-700 dark:hover:text-secondary-300",
  warning:
    "underline underline-offset-2 hover:text-warning-700 dark:hover:text-warning-300",
  success:
    "underline underline-offset-2 hover:text-success-700 dark:hover:text-success-300",
  promo: "font-semibold underline underline-offset-2 hover:opacity-80",
};

interface AnnouncementBarClientProps {
  config: AnnouncementConfig;
  locale: string;
}

export function AnnouncementBarClient({
  config,
  locale,
}: AnnouncementBarClientProps) {
  const dismissKey = `${DISMISS_KEY}_${encodeURIComponent(config.message).slice(0, 16)}`;

  const [dismissed, setDismissed] = useState(() => {
    if (!config.dismissable || typeof window === "undefined") return false;
    return !!localStorage.getItem(dismissKey);
  });

  if (dismissed) return null;

  const message =
    locale === "fr" && config.messageFr ? config.messageFr : config.message;
  const cta = locale === "fr" && config.ctaFr ? config.ctaFr : config.cta;
  const variant = config.variant ?? "info";

  function dismiss() {
    localStorage.setItem(dismissKey, "1");
    setDismissed(true);
  }

  return (
    <div
      className={cn(
        "w-full border-b px-4 py-2 text-xs text-center flex items-center justify-center gap-3 relative",
        VARIANT_STYLES[variant] ?? VARIANT_STYLES.info,
      )}
      role="banner"
    >
      <span className="font-medium">{message}</span>

      {cta && config.ctaHref && (
        <Link
          href={config.ctaHref as "/"}
          className={cn(
            "shrink-0 transition-colors",
            CTA_STYLES[variant] ?? CTA_STYLES.info,
          )}
        >
          {cta} →
        </Link>
      )}

      {config.dismissable && (
        <button
          onClick={dismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
