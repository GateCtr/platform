"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, Cookie, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const COOKIE_KEY = "gatectr_cookie_consent";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

type ConsentState = {
  necessary: true;
  analytics: boolean;
  decided: boolean;
};

function getConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_KEY}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split("=")[1]));
  } catch {
    return null;
  }
}

function setConsent(consent: ConsentState) {
  const value = encodeURIComponent(JSON.stringify(consent));
  // domain=.gatectr.com covers app., status., blog., docs., etc.
  const domain =
    typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? "; domain=.gatectr.com"
      : "";
  document.cookie = `${COOKIE_KEY}=${value}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax${domain}`;
}

export function CookieBanner() {
  const t = useTranslations("cookieBanner");
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    const existing = getConsent();
    if (!existing?.decided) {
      // Defer to next tick to avoid synchronous setState in effect
      const id = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(id);
    }
  }, []);

  if (!visible) return null;

  function accept() {
    setConsent({ necessary: true, analytics, decided: true });
    setVisible(false);
  }

  function acceptAll() {
    setConsent({ necessary: true, analytics: true, decided: true });
    setVisible(false);
  }

  function rejectOptional() {
    setConsent({ necessary: true, analytics: false, decided: true });
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className={cn(
        "fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-2rem))]",
        "rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-2xl",
        "p-5 flex flex-col gap-4",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Cookie className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{t("title")}</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <button
          onClick={rejectOptional}
          className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          aria-label={t("actions.decline")}
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t("description")}
      </p>

      {/* Details toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        {expanded ? (
          <ChevronUp className="size-3.5" />
        ) : (
          <ChevronDown className="size-3.5" />
        )}
        {expanded ? t("hide") : t("manage")}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-3">
          {/* Necessary */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium">{t("necessary.label")}</p>
              <p className="text-[11px] text-muted-foreground">
                {t("necessary.description")}
              </p>
            </div>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5 shrink-0">
              {t("necessary.badge")}
            </span>
          </div>

          {/* Analytics */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium">{t("analytics.label")}</p>
              <p className="text-[11px] text-muted-foreground">
                {t("analytics.description")}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={analytics}
              onClick={() => setAnalytics((v) => !v)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                analytics ? "bg-primary" : "bg-muted-foreground/30",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform",
                  analytics ? "translate-x-4" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={rejectOptional}
          className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {t("actions.necessaryOnly")}
        </button>
        <button
          onClick={expanded ? accept : acceptAll}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {expanded ? t("actions.savePreferences") : t("actions.acceptAll")}
        </button>
      </div>
    </div>
  );
}
