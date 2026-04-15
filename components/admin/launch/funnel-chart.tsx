"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { FunnelBySource } from "@/lib/actions/launch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SOURCE_COLORS: Record<string, string> = {
  producthunt: "#ff6154",
  twitter: "#1d9bf0",
  direct: "hsl(var(--primary))",
  newsletter: "#f59e0b",
};

const STEP_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.75)",
  "hsl(var(--primary) / 0.5)",
  "hsl(var(--primary) / 0.3)",
];

interface Props {
  data: FunnelBySource[];
}

export function FunnelChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No conversion data yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((source) => {
        const color = SOURCE_COLORS[source.source] ?? "hsl(var(--primary))";
        const chartData = source.steps.map((s) => ({
          name: s.label,
          count: s.count,
          rate: s.rate,
        }));

        return (
          <Card key={source.source} className="py-0 overflow-hidden">
            <CardHeader className="px-5 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold capitalize">
                  {source.source}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: color, color }}
                >
                  {source.steps[0].count} signups
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 py-4">
              {/* Step pills */}
              <div className="flex items-center gap-1 mb-4 flex-wrap">
                {source.steps.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-1">
                    <div
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium",
                        i === 0
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <span className="font-bold">{step.count}</span>{" "}
                      {step.label}
                      {i > 0 && (
                        <span className="ml-1 opacity-60">({step.rate}%)</span>
                      )}
                    </div>
                    {i < source.steps.length - 1 && (
                      <span className="text-muted-foreground text-xs">→</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <ResponsiveContainer width="100%" height={80}>
                <BarChart
                  data={chartData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  barSize={32}
                >
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      fontSize: 11,
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                    }}
                    formatter={(v: number) => [v, "users"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={STEP_COLORS[i] ?? STEP_COLORS[3]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
