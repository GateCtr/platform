"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { OverallStatusBanner } from "@/components/admin/system/overall-status-banner";
import { ServiceStatusTable } from "@/components/admin/system/service-status-table";
import { PlatformStatsGrid } from "@/components/admin/system/platform-stats-grid";
import type { SystemStatsPayload } from "@/app/api/admin/system/stats/route";
import type { SystemHistoryPayload } from "@/app/api/admin/system/history/route";

interface HealthResponse {
  status: string;
  services: Record<string, { status: string; checkedAt: string | null }>;
}

interface CombinedHealthData {
  health: HealthResponse;
  history: SystemHistoryPayload;
}

async function fetchHealthAndHistory(): Promise<CombinedHealthData> {
  const [healthRes, historyRes] = await Promise.all([
    fetch("/api/v1/system/health"),
    fetch("/api/admin/system/history"),
  ]);

  if (!healthRes.ok) throw new Error("health fetch failed");
  if (!historyRes.ok) throw new Error("history fetch failed");

  const [health, history] = await Promise.all([
    healthRes.json() as Promise<HealthResponse>,
    historyRes.json() as Promise<SystemHistoryPayload>,
  ]);

  return { health, history };
}

async function fetchStats(): Promise<SystemStatsPayload> {
  const res = await fetch("/api/admin/system/stats");
  if (!res.ok) throw new Error("stats fetch failed");
  return res.json() as Promise<SystemStatsPayload>;
}

export function SystemHealthClient() {
  const t = useTranslations("adminSystem");

  const [lastHealthData, setLastHealthData] = useState<CombinedHealthData | null>(null);
  const [lastStatsData, setLastStatsData] = useState<SystemStatsPayload | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const healthQuery = useQuery<CombinedHealthData>({
    queryKey: ["admin", "system", "health"],
    queryFn: async () => {
      const data = await fetchHealthAndHistory();
      setLastHealthData(data);
      setLastUpdatedAt(new Date());
      return data;
    },
    refetchInterval: 30_000,
  });

  const statsQuery = useQuery<SystemStatsPayload>({
    queryKey: ["admin", "system", "stats"],
    queryFn: async () => {
      const data = await fetchStats();
      setLastStatsData(data);
      return data;
    },
    refetchInterval: 30_000,
  });

  const healthData = healthQuery.data ?? lastHealthData;
  const statsData = statsQuery.data ?? lastStatsData;
  const isHealthError = healthQuery.isError && !healthData;
  const overallStatus = healthData?.health.status ?? "unknown";

  // Merge latency from history into services for display
  const servicesWithLatency: Record<
    string,
    { status: string; checkedAt: string | null; latencyMs: number | null }
  > = {};

  if (healthData) {
    for (const [name, svc] of Object.entries(healthData.health.services)) {
      const serviceHistory = healthData.history[name] ?? [];
      const latest = serviceHistory[serviceHistory.length - 1];
      servicesWithLatency[name] = {
        status: svc.status,
        checkedAt: svc.checkedAt,
        latencyMs: latest?.latencyMs ?? null,
      };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <OverallStatusBanner
        status={overallStatus}
        lastUpdatedAt={lastUpdatedAt}
        isError={isHealthError}
      />

      {healthData && (
        <ServiceStatusTable
          services={servicesWithLatency}
          history={healthData.history}
        />
      )}

      {!healthData && !isHealthError && (
        <div className="h-32 rounded-lg border border-border animate-pulse bg-muted/40" />
      )}

      <PlatformStatsGrid
        stats={statsData}
        isLoading={statsQuery.isLoading && !statsData}
      />
    </div>
  );
}
