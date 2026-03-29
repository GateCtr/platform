"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import type { SystemStatsPayload } from "@/app/api/admin/system/stats/route";

interface PlatformStatsGridProps {
  stats: SystemStatsPayload | null;
  isLoading: boolean;
}

interface StatCardProps {
  label: string;
  value: string;
  isLoading: boolean;
}

function StatCard({ label, value, isLoading }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      {isLoading ? (
        <Skeleton className="h-7 w-20" />
      ) : (
        <span className="text-2xl font-semibold tabular-nums leading-none">
          {value}
        </span>
      )}
    </div>
  );
}

export function PlatformStatsGrid({
  stats,
  isLoading,
}: PlatformStatsGridProps) {
  const t = useTranslations("adminSystem.stats");

  const noData = t("noData");
  const ms = t("ms");

  const cards = [
    {
      label: t("totalRequests"),
      value: stats ? stats.totalRequests24h.toLocaleString() : noData,
    },
    {
      label: t("p50Latency"),
      value: stats ? `${stats.p50LatencyMs} ${ms}` : noData,
    },
    {
      label: t("p95Latency"),
      value: stats ? `${stats.p95LatencyMs} ${ms}` : noData,
    },
    {
      label: t("errorRate"),
      value: stats ? `${stats.errorRatePct}%` : noData,
    },
    {
      label: t("cacheHitRate"),
      value: stats ? `${stats.cacheHitRatePct}%` : noData,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
