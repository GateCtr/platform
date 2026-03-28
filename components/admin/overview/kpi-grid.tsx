import { useTranslations } from "next-intl";
import { KpiCard } from "./kpi-card";
import { WidgetErrorBoundary } from "./error-boundary";
import type { OverviewKpiPayload } from "@/app/api/admin/overview/route";

interface KpiGridProps {
  data?: OverviewKpiPayload;
  isLoading?: boolean;
}

function formatMrr(cents: number): string {
  const euros = cents / 100;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(euros);
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function KpiGrid({ data, isLoading }: KpiGridProps) {
  const t = useTranslations("adminOverview.kpi");

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <WidgetErrorBoundary>
        <KpiCard
          label={t("totalUsers")}
          value={data?.activeUsers ?? 0}
          isLoading={isLoading}
        />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary>
        <KpiCard
          label={t("activeSubscriptions")}
          value={data?.activeSubscriptions ?? 0}
          isLoading={isLoading}
        />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary>
        <KpiCard
          label={t("mrr")}
          value={data ? formatMrr(data.mrrCents) : "—"}
          isLoading={isLoading}
        />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary>
        <KpiCard
          label={t("tokensThisMonth")}
          value={data ? formatTokens(data.tokensThisMonth) : "—"}
          isLoading={isLoading}
        />
      </WidgetErrorBoundary>
    </div>
  );
}
