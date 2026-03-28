"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ServiceSparkline } from "./service-sparkline";
import type { SystemHistoryPayload } from "@/app/api/admin/system/history/route";

const SERVICES = ["app", "database", "redis", "queue", "stripe"] as const;

const STATUS_DOT: Record<string, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-destructive",
  unknown: "bg-muted-foreground/40",
};

const STATUS_BADGE: Record<string, string> = {
  healthy: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  degraded: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  down: "bg-destructive/10 text-destructive",
  unknown: "bg-muted text-muted-foreground",
};

const ROW_HIGHLIGHT: Record<string, string> = {
  degraded: "bg-amber-500/5",
  down: "bg-destructive/5",
};

interface ServiceEntry {
  status: string;
  checkedAt: Date | string | null;
  latencyMs?: number | null;
}

interface ServiceStatusTableProps {
  services: Record<string, ServiceEntry>;
  history: SystemHistoryPayload;
}

function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ServiceStatusTable({
  services,
  history,
}: ServiceStatusTableProps) {
  const t = useTranslations("adminSystem.services");

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
              {t("title")}
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
              {t("latency")}
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
              {t("lastChecked")}
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground min-w-[120px]">
              {t("history")}
            </th>
          </tr>
        </thead>
        <tbody>
          {SERVICES.map((name) => {
            const svc = services[name] ?? {
              status: "unknown",
              checkedAt: null,
              latencyMs: null,
            };
            const statusKey = svc.status.toLowerCase();
            const rowClass = ROW_HIGHLIGHT[statusKey] ?? "";
            const serviceHistory = history[name] ?? [];

            return (
              <tr
                key={name}
                className={cn(
                  "border-b border-border last:border-0 transition-colors",
                  rowClass,
                )}
              >
                <td className="px-4 py-3 font-medium capitalize">
                  {t(name as "app" | "database" | "redis" | "queue" | "stripe")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                      STATUS_BADGE[statusKey] ?? STATUS_BADGE.unknown,
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        STATUS_DOT[statusKey] ?? STATUS_DOT.unknown,
                      )}
                    />
                    {svc.status}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {svc.latencyMs != null ? `${svc.latencyMs} ms` : "—"}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground text-xs">
                  {formatDate(svc.checkedAt)}
                </td>
                <td className="px-4 py-3 w-32">
                  <ServiceSparkline history={serviceHistory} service={name} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
