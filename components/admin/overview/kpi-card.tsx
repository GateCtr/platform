"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  value: string | number;
  label: string;
  trend?: number; // delta vs last month (positive = up, negative = down)
  isLoading?: boolean;
}

export function KpiCard({ value, label, trend, isLoading }: KpiCardProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  const trendIcon =
    trend === undefined || trend === 0 ? (
      <Minus className="size-3" />
    ) : trend > 0 ? (
      <TrendingUp className="size-3" />
    ) : (
      <TrendingDown className="size-3" />
    );

  const trendColor =
    trend === undefined || trend === 0
      ? "text-muted-foreground"
      : trend > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-destructive";

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-card">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums leading-none">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
          {trendIcon}
          <span>
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
