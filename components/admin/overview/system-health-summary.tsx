"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceStatus = "healthy" | "degraded" | "down" | "unknown";

interface ServiceHealth {
  status: string;
  checkedAt: string | null;
}

interface HealthResponse {
  status: string;
  services: Record<string, ServiceHealth>;
}

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

export function SystemHealthSummary() {
  const t = useTranslations("adminOverview.health");
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/v1/system/health")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const overallStatus = (data?.status ?? "unknown") as ServiceStatus;
  const services = data?.services ?? {};

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {t("title")}
        </span>
        <Link
          href="/admin/system"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("viewAll")}
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {error ? (
        <span className="text-xs text-muted-foreground">{t("unavailable")}</span>
      ) : (
        <>
          {/* Overall badge */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                STATUS_BADGE[overallStatus] ?? STATUS_BADGE.unknown,
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  STATUS_DOT[overallStatus] ?? STATUS_DOT.unknown,
                )}
              />
              {t(`status.${overallStatus}`)}
            </span>
          </div>

          {/* Per-service dots */}
          <div className="flex items-center gap-3 flex-wrap">
            {Object.entries(services).map(([name, svc]) => {
              const s = svc.status as ServiceStatus;
              return (
                <div key={name} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      STATUS_DOT[s] ?? STATUS_DOT.unknown,
                    )}
                    title={`${name}: ${s}`}
                  />
                  <span className="text-[11px] text-muted-foreground capitalize">
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
