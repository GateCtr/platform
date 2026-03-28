"use client";

import { useTranslations } from "next-intl";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PlanDistributionChartProps {
  distribution: Record<string, number>;
}

const PLAN_COLORS: Record<string, string> = {
  FREE: "hsl(var(--muted-foreground))",
  PRO: "hsl(var(--primary))",
  TEAM: "hsl(221 83% 53%)",
  ENTERPRISE: "hsl(262 83% 58%)",
};

const FALLBACK_COLORS = [
  "hsl(var(--primary))",
  "hsl(221 83% 53%)",
  "hsl(262 83% 58%)",
  "hsl(var(--muted-foreground))",
];

export function PlanDistributionChart({
  distribution,
}: PlanDistributionChartProps) {
  const t = useTranslations("adminOverview.charts");

  const data = Object.entries(distribution).map(([plan, count]) => ({
    name: plan,
    value: count,
  }));

  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card">
        <span className="text-xs font-medium text-muted-foreground">
          {t("planDistribution")}
        </span>
        <span className="text-xs text-muted-foreground">{t("noData")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card">
      <span className="text-xs font-medium text-muted-foreground">
        {t("planDistribution")}
      </span>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={65}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={
                  PLAN_COLORS[entry.name] ??
                  FALLBACK_COLORS[index % FALLBACK_COLORS.length]
                }
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontSize: 11,
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
            }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
