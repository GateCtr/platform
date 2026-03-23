"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bell,
  BellOff,
  CheckCheck,
  ShieldAlert,
  Zap,
  Clock,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import type { InAppAlert, AlertSeverity } from "@/hooks/use-notifications";

// ─── Severity config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { dot: string; bg: string; icon: React.ElementType }
> = {
  critical: {
    dot: "bg-destructive",
    bg: "border-l-destructive/60 bg-destructive/5",
    icon: ShieldAlert,
  },
  warning: {
    dot: "bg-warning-500",
    bg: "border-l-warning-500/60 bg-warning-500/5",
    icon: Zap,
  },
  info: {
    dot: "bg-primary/60",
    bg: "border-l-primary/30 bg-primary/3",
    icon: Activity,
  },
};

const ALERT_TYPE_ICON: Record<string, React.ElementType> = {
  budget_threshold: Zap,
  token_limit: ShieldAlert,
  error_rate: Activity,
  latency: Clock,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotificationRow({
  alert,
  onAcknowledge,
}: {
  alert: InAppAlert;
  onAcknowledge: (id: string) => void;
}) {
  const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
  const TypeIcon = ALERT_TYPE_ICON[alert.rule.alertType] ?? Activity;

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-l-2 transition-colors",
        alert.acknowledged ? "border-l-transparent opacity-50" : cfg.bg,
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md mt-0.5",
          alert.acknowledged
            ? "bg-muted"
            : "bg-background border border-border",
        )}
      >
        <TypeIcon className="size-3.5 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p
          className={cn(
            "text-xs font-medium leading-snug",
            alert.acknowledged ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {alert.message}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground truncate">
            {alert.rule.name}
          </span>
          <span className="text-[10px] text-muted-foreground/50">·</span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {timeAgo(alert.createdAt)}
          </span>
        </div>
      </div>

      {/* Unread dot / ack button */}
      {!alert.acknowledged && (
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="shrink-0 mt-1 group"
          aria-label="Mark as read"
        >
          <span
            className={cn(
              "block size-2 rounded-full transition-all group-hover:scale-125",
              cfg.dot,
            )}
          />
        </button>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function NotificationPanel() {
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const { alerts, unreadCount, isLoading, acknowledge, acknowledgeAll } =
    useNotifications();

  const unread = alerts.filter((a) => !a.acknowledged);
  const read = alerts.filter((a) => a.acknowledged);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 relative"
          aria-label={t("trigger")}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-2">
              <span className="animate-ping absolute inline-flex size-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-destructive" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 p-0 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{t("title")}</p>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={acknowledgeAll}
            >
              <CheckCheck className="size-3" />
              {t("markAllRead")}
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <BellOff className="size-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {t("empty.title")}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {t("empty.description")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {/* Unread */}
              {unread.length > 0 && (
                <div>
                  {unread.map((alert) => (
                    <NotificationRow
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={acknowledge}
                    />
                  ))}
                </div>
              )}

              {/* Read — collapsed if many */}
              {read.length > 0 && (
                <div>
                  {unread.length > 0 && (
                    <p className="px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {t("earlier")}
                    </p>
                  )}
                  {read.slice(0, 5).map((alert) => (
                    <NotificationRow
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={acknowledge}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="border-t border-border px-4 py-2.5">
            <p className="text-[10px] text-muted-foreground text-center">
              {t("footer", { count: alerts.length })}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
