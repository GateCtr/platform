"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

type Metric = "totalTokens" | "totalCostUsd" | "savedTokens";

interface TrendPoint {
  date: string;
  totalTokens: number;
  totalRequests: number;
  totalCostUsd: number;
  savedTokens: number;
}

interface MultiTrendChartProps {
  data: TrendPoint[];
  labels: {
    tokens: string;
    cost: string;
    saved: string;
  };
}

const METRICS: { key: Metric; color: string; gradientId: string }[] = [
  {
    key: "totalTokens",
    color: "hsl(var(--primary))",
    gradientId: "gradTokens",
  },
  { key: "totalCostUsd", color: "hsl(30 80% 55%)", gradientId: "gradCost" },
  { key: "savedTokens", color: "hsl(160 60% 45%)", gradientId: "gradSaved" },
];

export function MultiTrendChart({ data, labels }: MultiTrendChartProps) {
  const [active, setActive] = useState<Set<Metric>>(
    new Set(["totalTokens", "savedTokens"]),
  );

  function toggle(key: Metric) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const labelMap: Record<Metric, string> = {
    totalTokens: labels.tokens,
    totalCostUsd: labels.cost,
    savedTokens: labels.saved,
  };

  return (
    <div className="space-y-3">
      {/* Toggle pills */}
      <div className="flex flex-wrap gap-2">
        {METRICS.map(({ key, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              active.has(key)
                ? "border-transparent text-white"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
            style={active.has(key) ? { background: color } : undefined}
          >
            {labelMap[key]}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            {METRICS.map(({ gradientId, color }) => (
              <linearGradient
                key={gradientId}
                id={gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}M`
                : v >= 1_000
                  ? `${(v / 1_000).toFixed(0)}K`
                  : String(v)
            }
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "totalCostUsd")
                return [`$${value.toFixed(4)}`, labels.cost];
              if (name === "savedTokens")
                return [value.toLocaleString(), labels.saved];
              return [value.toLocaleString(), labels.tokens];
            }}
            labelClassName="text-xs"
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
            }}
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
          />

          {METRICS.map(({ key, color, gradientId }) =>
            active.has(key) ? (
              <Area
                key={key}
                type="monotoneX"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ) : null,
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
