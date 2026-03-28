"use client";

import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ProviderData {
  provider: string;
  tokens: number;
}

interface ProviderBreakdownChartProps {
  data: ProviderData[];
  isLoading?: boolean;
}

// Consistent colors per provider
const PROVIDER_COLORS: Record<string, string> = {
  openai: "hsl(var(--primary))",
  anthropic: "hsl(142 71% 45%)",
  mistral: "hsl(38 92% 50%)",
  gemini: "hsl(217 91% 60%)",
};

function getProviderColor(provider: string): string {
  return (
    PROVIDER_COLORS[provider.toLowerCase()] ?? "hsl(var(--muted-foreground))"
  );
}

function formatTokenTick(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export function ProviderBreakdownChart({
  data,
  isLoading,
}: ProviderBreakdownChartProps) {
  const t = useTranslations("adminAnalytics.charts");

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card">
      <span className="text-xs font-medium text-muted-foreground">
        {t("providerBreakdown")}
      </span>
      {isLoading ? (
        <Skeleton className="h-[140px] w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
          >
            <XAxis
              dataKey="provider"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) =>
                v.charAt(0).toUpperCase() + v.slice(1)
              }
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
            <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.provider}
                  fill={getProviderColor(entry.provider)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
