"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, AlertTriangle, XCircle, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeOverallStatus } from "@/lib/admin/utils";

interface OverallStatusBannerProps {
  status: string;
  lastUpdatedAt: Date | null;
  isError: boolean;
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
}

export function OverallStatusBanner({
  status,
  lastUpdatedAt,
  isError,
}: OverallStatusBannerProps) {
  const t = useTranslations("adminSystem.status");

  if (isError) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
        <WifiOff className="size-4 text-muted-foreground shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-muted-foreground">
            {t("unavailable")}
          </span>
          {lastUpdatedAt && (
            <span className="text-xs text-muted-foreground">
              {t("lastUpdated", { time: formatRelativeTime(lastUpdatedAt) })}
            </span>
          )}
        </div>
      </div>
    );
  }

  const normalized = status.toUpperCase();
  const overall = computeOverallStatus([normalized]);

  const config = {
    HEALTHY: {
      icon: CheckCircle2,
      label: t("healthy"),
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      iconClass: "text-emerald-500",
    },
    DEGRADED: {
      icon: AlertTriangle,
      label: t("degraded"),
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      iconClass: "text-amber-500",
    },
    DOWN: {
      icon: XCircle,
      label: t("down"),
      className: "border-destructive/30 bg-destructive/10 text-destructive",
      iconClass: "text-destructive",
    },
  } as const;

  const { icon: Icon, label, className, iconClass } = config[overall];

  return (
    <div className={cn("flex items-center gap-3 rounded-lg border px-4 py-3", className)}>
      <Icon className={cn("size-5 shrink-0", iconClass)} />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        {lastUpdatedAt && (
          <span className="text-xs opacity-75">
            {t("lastUpdated", { time: formatRelativeTime(lastUpdatedAt) })}
          </span>
        )}
      </div>
    </div>
  );
}
