"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Delivery {
  id: string;
  deliveryId: string;
  event: string;
  status: number;
  success: boolean;
  responseMs: number;
  retryCount: number;
  createdAt: string;
}

interface WebhookRowProps {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastFiredAt: string | null;
  successCount: number;
  failCount: number;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export function WebhookRow({
  id,
  name,
  url,
  events,
  isActive,
  lastFiredAt,
  successCount,
  failCount,
  onToggleActive,
  onDelete,
}: WebhookRowProps) {
  const t = useTranslations("webhooks");
  const [expanded, setExpanded] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const hasFailures = failCount > 5;
  const totalDeliveries = successCount + failCount;
  const successRate =
    totalDeliveries > 0
      ? Math.round((successCount / totalDeliveries) * 100)
      : null;

  async function loadDeliveries() {
    if (deliveries) return;
    setLoadingDeliveries(true);
    try {
      const res = await fetch(`/api/v1/webhooks/${id}/deliveries`);
      const data = await res.json();
      setDeliveries((data.deliveries as Delivery[]).slice(0, 10));
    } catch {
      setDeliveries([]);
    } finally {
      setLoadingDeliveries(false);
    }
  }

  function handleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next) loadDeliveries();
  }

  async function handleTest() {
    setTestStatus("sending");
    try {
      const res = await fetch(`/api/v1/webhooks/${id}/test`, {
        method: "POST",
      });
      setTestStatus(res.ok ? "success" : "error");
    } catch {
      setTestStatus("error");
    }
    setTestSent(true);
    setTimeout(() => {
      setTestSent(false);
      setTestStatus("idle");
    }, 3000);
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-shadow hover:shadow-sm",
        !isActive && "opacity-60",
      )}
    >
      {/* ── Main row ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Status dot */}
        <div className="shrink-0">
          <span
            className={cn(
              "block h-2.5 w-2.5 rounded-full",
              isActive
                ? "bg-green-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.4)]"
                : "bg-muted-foreground/40",
            )}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{name}</span>
            {hasFailures && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <AlertTriangle className="size-3" />
                {t("row.failWarning", { count: failCount })}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground font-mono truncate">
            {url}
          </p>

          {/* Events */}
          <div className="flex flex-wrap gap-1">
            {events.slice(0, 5).map((ev) => (
              <span
                key={ev}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground font-mono"
              >
                {ev}
              </span>
            ))}
            {events.length > 5 && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                +{events.length - 5}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-5 text-xs text-muted-foreground shrink-0">
          {successRate !== null && (
            <div className="text-center">
              <p
                className={cn(
                  "font-semibold text-sm tabular-nums",
                  successRate >= 90
                    ? "text-green-600"
                    : successRate >= 70
                      ? "text-amber-600"
                      : "text-red-600",
                )}
              >
                {successRate}%
              </p>
              <p>{t("stats.successRate")}</p>
            </div>
          )}
          {lastFiredAt && (
            <div className="text-center">
              <p className="font-medium text-sm text-foreground">
                {new Date(lastFiredAt).toLocaleDateString()}
              </p>
              <p>{t("row.lastFired")}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTest}
            disabled={testStatus === "sending"}
            title={t("row.sendTest")}
            className={cn(
              testStatus === "success" && "text-green-600",
              testStatus === "error" && "text-red-500",
            )}
          >
            <Send
              className={cn(
                "size-3.5",
                testStatus === "sending" && "animate-pulse",
              )}
            />
          </Button>

          <Button variant="ghost" size="sm" onClick={handleExpand}>
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onToggleActive(id, !isActive)}>
                {isActive ? t("row.disable") : t("row.enable")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete(id)}
              >
                <Trash2 className="size-3.5 mr-2" />
                {t("row.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Test feedback ─────────────────────────────────────────────── */}
      {testSent && (
        <div
          className={cn(
            "mx-5 mb-3 rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2",
            testStatus === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
          )}
        >
          {testStatus === "success" ? (
            <>
              <CheckCircle2 className="size-3.5 shrink-0" />
              {t("row.testSuccess")}
            </>
          ) : (
            <>
              <XCircle className="size-3.5 shrink-0" />
              {t("row.testError")}
            </>
          )}
        </div>
      )}

      {/* ── Delivery history ──────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t bg-muted/30 px-5 py-4 space-y-3 rounded-b-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("row.deliveries")}
          </p>

          {loadingDeliveries && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {deliveries && deliveries.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              {t("row.noDeliveries")}
            </p>
          )}

          {deliveries && deliveries.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      {t("row.colEvent")}
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      {t("row.colStatus")}
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">
                      {t("row.colLatency")}
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground hidden sm:table-cell">
                      {t("row.colTime")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deliveries.map((d) => (
                    <tr
                      key={d.id}
                      className="bg-card hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2.5 font-mono text-foreground">
                        {d.event}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                            d.success
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          )}
                        >
                          {d.success ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <XCircle className="size-3" />
                          )}
                          {d.status || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {d.responseMs}ms
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground hidden sm:table-cell">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
