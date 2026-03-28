"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, XCircle, Info, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sortAlertsBySeverity, type AlertSeverity } from "@/lib/admin/utils";
import { acknowledgeAlert } from "@/app/[locale]/(admin)/admin/notifications/_actions";

export interface AlertRow {
  id: string;
  severity: AlertSeverity;
  message: string;
  createdAt: Date;
  rule: { name: string } | null;
}

interface UnacknowledgedAlertsListProps {
  alerts: AlertRow[];
  onAcknowledged: (id: string) => void;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: XCircle,
    badgeClass: "border-destructive/40 bg-destructive/10 text-destructive",
    rowClass: "border-destructive/20 bg-destructive/5",
    iconClass: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    badgeClass:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    rowClass: "border-amber-500/20 bg-amber-500/5",
    iconClass: "text-amber-500",
  },
  info: {
    icon: Info,
    badgeClass:
      "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    rowClass: "border-blue-500/20 bg-blue-500/5",
    iconClass: "text-blue-500",
  },
} as const;

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function UnacknowledgedAlertsList({
  alerts,
  onAcknowledged,
}: UnacknowledgedAlertsListProps) {
  const t = useTranslations("adminNotifications.unacknowledged");
  const [pending, setPending] = React.useState<Set<string>>(new Set());

  const sorted = sortAlertsBySeverity(
    alerts.map((a) => ({ ...a, createdAt: new Date(a.createdAt) })),
  );

  async function handleAcknowledge(id: string) {
    setPending((prev) => new Set(prev).add(id));
    try {
      const result = await acknowledgeAlert(id);
      if (result.success) {
        toast.success(t("acknowledgeSuccess"));
        onAcknowledged(id);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("acknowledgeError"));
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
        <CheckCheck className="size-8 text-emerald-500" />
        <p className="text-sm font-medium">{t("empty")}</p>
        <p className="text-xs text-muted-foreground">{t("emptySubtitle")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((alert) => {
        const config = SEVERITY_CONFIG[alert.severity];
        const Icon = config.icon;
        const isPending = pending.has(alert.id);

        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-4 py-3",
              config.rowClass,
            )}
          >
            <Icon className={cn("mt-0.5 size-4 shrink-0", config.iconClass)} />
            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 capitalize",
                    config.badgeClass,
                  )}
                >
                  {alert.severity}
                </Badge>
                {alert.rule && (
                  <span className="text-xs text-muted-foreground truncate">
                    {alert.rule.name}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                  {formatRelativeTime(alert.createdAt)}
                </span>
              </div>
              <p className="text-sm">{alert.message}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 h-7 text-xs"
              disabled={isPending}
              onClick={() => handleAcknowledge(alert.id)}
            >
              {isPending ? t("acknowledging") : t("acknowledge")}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
