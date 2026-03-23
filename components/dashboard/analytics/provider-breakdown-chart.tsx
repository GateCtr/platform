"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 220 70% 50%))",
  "hsl(var(--chart-3, 160 60% 45%))",
  "hsl(var(--chart-4, 30 80% 55%))",
  "hsl(var(--chart-5, 280 65% 60%))",
];

interface ProviderRow {
  provider: string;
  totalTokens: number;
  totalRequests: number;
  totalCostUsd: number;
}

interface ProviderBreakdownChartProps {
  data: ProviderRow[];
  tokensLabel: string;
  costLabel: string;
}

export function ProviderBreakdownChart({
  data,
  tokensLabel,
  costLabel,
}: ProviderBreakdownChartProps) {
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="provider" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) =>
              v >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}M`
                : v >= 1_000
                  ? `${(v / 1_000).toFixed(0)}K`
                  : String(v)
            }
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              name === "totalTokens"
                ? value.toLocaleString()
                : `$${value.toFixed(4)}`,
              name === "totalTokens" ? tokensLabel : costLabel,
            ]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="totalTokens" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {data.map((row, i) => (
          <div
            key={row.provider}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="font-medium text-foreground">{row.provider}</span>
            <span>{row.totalTokens.toLocaleString()} tokens</span>
            <span>· ${row.totalCostUsd.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
