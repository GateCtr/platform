"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendPoint {
  date: string;
  totalTokens: number;
}

interface TokenTrendChartProps {
  data: TrendPoint[];
  tokensLabel: string;
}

export function TokenTrendChart({ data, tokensLabel }: TokenTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: string) => v.slice(5)} // MM-DD
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) =>
            v >= 1_000_000
              ? `${(v / 1_000_000).toFixed(1)}M`
              : v >= 1_000
                ? `${(v / 1_000).toFixed(0)}K`
                : String(v)
          }
          className="text-muted-foreground"
        />
        <Tooltip
          formatter={(value: number) => [value.toLocaleString(), tokensLabel]}
          labelClassName="text-xs"
          contentStyle={{ fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="totalTokens"
          name={tokensLabel}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          className="stroke-primary"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
