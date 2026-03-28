"use client";

import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TokenKpiRowProps {
  current: number;
  previous: number;
  pctChange: number;
  savedByOptimizer: number;
  dau: number;
  mau: number;
  isLoading?: boolean;
}

function StatCard({
  label,
  value,
  sub,
  isLoading,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  isLoading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-card">
      <span className="text-xs text-muted-foreground">{label}</span>
      {isLoading ? (
        <>
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-16" />
        </>
      ) : (
        <>
          <span className="text-2xl font-semibold tabular-nums leading-none">
            {value}
          </span>
          {sub && <div className="text-xs">{sub}</div>}
        </>
      )}
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function TokenKpiRow({
  current,
  previous,
  pctChange,
  savedByOptimizer,
  dau,
  mau,
  isLoading,
}: TokenKpiRowProps) {
  const t = useTranslations("adminAnalytics.kpi");

  const trendColor =
    pctChange === 0
      ? "text-muted-foreground"
      : pctChange > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-destructive";

  const TrendIcon =
    pctChange === 0 ? Minus : pctChange > 0 ? TrendingUp : TrendingDown;

  const trendSub = (
    <span className={cn("flex items-center gap-1", trendColor)}>
      <TrendIcon className="size-3" />
      {pctChange > 0 ? "+" : ""}
      {pctChange.toFixed(1)}% {t("pctChange")}
    </span>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard
        label={t("currentPeriod")}
        value={`${formatTokens(current)} ${t("tokens")}`}
        sub={trendSub}
        isLoading={isLoading}
      />
      <StatCard
        label={t("previousPeriod")}
        value={`${formatTokens(previous)} ${t("tokens")}`}
        isLoading={isLoading}
      />
      <StatCard
        label={t("savedByOptimizer")}
        value={`${formatTokens(savedByOptimizer)} ${t("tokens")}`}
        isLoading={isLoading}
      />
      <StatCard
        label={t("dau")}
        value={dau.toLocaleString()}
        isLoading={isLoading}
      />
      <StatCard
        label={t("mau")}
        value={mau.toLocaleString()}
        isLoading={isLoading}
      />
    </div>
  );
}
