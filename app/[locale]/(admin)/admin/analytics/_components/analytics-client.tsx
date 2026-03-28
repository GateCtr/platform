"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  AnalyticsDateRangePicker,
  type RangeOption,
} from "@/components/admin/analytics/analytics-date-range-picker";
import { TokenKpiRow } from "@/components/admin/analytics/token-kpi-row";
import { DailyTokenTrendChart } from "@/components/admin/analytics/daily-token-trend-chart";
import { ProviderBreakdownChart } from "@/components/admin/analytics/provider-breakdown-chart";
import { ModelBreakdownTable } from "@/components/admin/analytics/model-breakdown-table";
import { TopUsersTable } from "@/components/admin/analytics/top-users-table";
import { ExportButton } from "@/components/admin/analytics/export-button";
import type { AnalyticsPayload } from "@/app/api/admin/analytics/route";

async function fetchAnalytics(range: RangeOption): Promise<AnalyticsPayload> {
  const res = await fetch(`/api/admin/analytics?range=${range}`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json() as Promise<AnalyticsPayload>;
}

interface AnalyticsClientProps {
  initialRange: RangeOption;
}

export function AnalyticsClient({ initialRange }: AnalyticsClientProps) {
  const t = useTranslations("adminAnalytics");
  const searchParams = useSearchParams();

  // Derive range from URL so picker updates trigger re-fetch
  const rawRange = searchParams.get("range");
  const range: RangeOption =
    rawRange === "7d" || rawRange === "90d" ? rawRange : initialRange;

  const { data, isLoading, isError } = useQuery<AnalyticsPayload>({
    queryKey: ["admin", "analytics", range],
    queryFn: () => fetchAnalytics(range),
    staleTime: 60_000,
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <AnalyticsDateRangePicker value={range} />
          <ExportButton range={range} />
        </div>
      </div>

      {/* Error state */}
      {isError && !data && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t("errors.loadFailed")}
        </div>
      )}

      {/* KPI row */}
      <TokenKpiRow
        current={data?.tokens.current ?? 0}
        previous={data?.tokens.previous ?? 0}
        pctChange={data?.tokens.pctChange ?? 0}
        savedByOptimizer={data?.tokens.savedByOptimizer ?? 0}
        dau={data?.dau ?? 0}
        mau={data?.mau ?? 0}
        isLoading={isLoading}
      />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DailyTokenTrendChart
          data={data?.dailyTrend ?? []}
          isLoading={isLoading}
        />
        <ProviderBreakdownChart
          data={data?.byProvider ?? []}
          isLoading={isLoading}
        />
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ModelBreakdownTable data={data?.byModel ?? []} isLoading={isLoading} />
        <TopUsersTable data={data?.topUsers ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
