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
import type { TrendDataPoint } from "@/lib/admin/utils";

interface SignupTrendChartProps {
  data: TrendDataPoint[];
}

export function SignupTrendChart({ data }: SignupTrendChartProps) {
  const t = useTranslations("adminOverview.charts");

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card">
      <span className="text-xs font-medium text-muted-foreground">
        {t("signupTrend")}
      </span>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
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
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
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
          />
          <Area
            type="monotone"
            dataKey="count"
            name={t("signups")}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#signupGradient)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
