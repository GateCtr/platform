"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SignupPoint } from "@/lib/actions/launch";

const SOURCE_COLORS: Record<string, string> = {
  producthunt: "#ff6154",
  twitter: "#1d9bf0",
  direct: "hsl(var(--primary))",
  newsletter: "#f59e0b",
  direct_other: "hsl(var(--muted-foreground))",
};

function colorForSource(source: string): string {
  return (
    SOURCE_COLORS[source] ?? `hsl(${Math.abs(hashStr(source)) % 360}, 60%, 55%)`
  );
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

interface Props {
  data: SignupPoint[];
}

export function SignupTimeSeries({ data }: Props) {
  if (data.length === 0) return null;

  // Collect all sources
  const sources = Array.from(
    new Set(data.flatMap((d) => Object.keys(d.bySource))),
  );

  // Flatten for recharts
  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    total: d.total,
    ...d.bySource,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={chartData}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
      >
        <defs>
          {sources.map((s) => (
            <linearGradient
              key={s}
              id={`grad-${s}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={colorForSource(s)}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={colorForSource(s)}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
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
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          formatter={(v) => <span className="capitalize">{v}</span>}
        />
        {sources.map((s) => (
          <Area
            key={s}
            type="monotone"
            dataKey={s}
            name={s}
            stroke={colorForSource(s)}
            strokeWidth={2}
            fill={`url(#grad-${s})`}
            dot={false}
            stackId="1"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
