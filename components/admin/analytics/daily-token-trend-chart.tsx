"use client";

import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrendDataPoint } from "@/lib/admin/utils";

interface DailyTokenTrendChartProps {
  data: TrendDataPoint[];
  isLoading?: boolean;
}

function formatTokenTick(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export function DailyTokenTrendChart({
  data,
  isLoading,
}: DailyTokenTrendChartProps) {
  const t = useTranslations("adminAnalytics.charts");

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card">
      <span className="text-xs font-medium text-muted-foreground">
        {t("dailyTrend")}
      </span>
      {isLoading ? (
        <Skeleton className="h-[140px] w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: string) => v.slice(5)}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={formatTokenTick}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 6,
              }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [
                value.toLocaleString(),
                t("tokens"),
              ]}
            />
            <Area
              type="monotone"
              dataKey="count"
              name={t("tokens")}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#tokenGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
