"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  Users,
  Mail,
  Eye,
  MousePointer,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import type { OutreachStats } from "@/lib/actions/outreach";
import type { SerializedProspect } from "./outreach-page";

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function KpiCard({ title, value, icon }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

// ─── Recent activity ──────────────────────────────────────────────────────────

interface ActivityEvent {
  prospectName: string;
  eventType: string;
  timestamp: string;
}

function buildRecentActivity(prospects: SerializedProspect[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const p of prospects) {
    const name = `${p.firstName} ${p.lastName}`;
    for (const log of p.emailLogs) {
      if (log.sentAt) {
        events.push({
          prospectName: name,
          eventType: "sent",
          timestamp: log.sentAt,
        });
      }
      if (log.openedAt) {
        events.push({
          prospectName: name,
          eventType: "opened",
          timestamp: log.openedAt,
        });
      }
      if (log.clickedAt) {
        events.push({
          prospectName: name,
          eventType: "clicked",
          timestamp: log.clickedAt,
        });
      }
      if (log.status === "BOUNCED") {
        events.push({
          prospectName: name,
          eventType: "bounced",
          timestamp: log.createdAt,
        });
      }
    }
  }

  return events
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 20);
}

const EVENT_ICON: Record<string, string> = {
  sent: "📤",
  opened: "👁️",
  clicked: "🖱️",
  bounced: "⚠️",
  delivered: "✅",
  failed: "❌",
};

// ─── Stats tab ────────────────────────────────────────────────────────────────

interface StatsTabProps {
  stats: OutreachStats;
  prospects: SerializedProspect[];
}

export function StatsTab({ stats, prospects }: StatsTabProps) {
  const t = useTranslations("adminOutreach");

  const fmt = (rate: number) => `${(rate * 100).toFixed(1)}%`;

  // Funnel data
  const funnelData = useMemo(
    () => [
      {
        label: t("stats.funnel.new"),
        count: stats.byStatus.NEW,
        fill: "#94a3b8",
      },
      {
        label: t("stats.funnel.contacted"),
        count: stats.byStatus.CONTACTED,
        fill: "#60a5fa",
      },
      {
        label: t("stats.funnel.replied"),
        count: stats.byStatus.REPLIED,
        fill: "#818cf8",
      },
      {
        label: t("stats.funnel.meetingBooked"),
        count: stats.byStatus.MEETING_BOOKED,
        fill: "#a78bfa",
      },
      {
        label: t("stats.funnel.converted"),
        count: stats.byStatus.CONVERTED,
        fill: "#34d399",
      },
    ],
    [stats, t],
  );

  const recentActivity = useMemo(
    () => buildRecentActivity(prospects),
    [prospects],
  );

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title={t("stats.kpi.totalProspects")}
          value={stats.totalProspects}
          icon={<Users className="size-4" />}
        />
        <KpiCard
          title={t("stats.kpi.emailsSent")}
          value={stats.totalEmailsSent}
          icon={<Mail className="size-4" />}
        />
        <KpiCard
          title={t("stats.kpi.openRate")}
          value={fmt(stats.openRate)}
          icon={<Eye className="size-4" />}
        />
        <KpiCard
          title={t("stats.kpi.clickRate")}
          value={fmt(stats.clickRate)}
          icon={<MousePointer className="size-4" />}
        />
        <KpiCard
          title={t("stats.kpi.replyRate")}
          value={fmt(stats.replyRate)}
          icon={<MessageSquare className="size-4" />}
        />
        <KpiCard
          title={t("stats.kpi.conversionRate")}
          value={fmt(stats.conversionRate)}
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("stats.funnel.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={funnelData}
              margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                formatter={(value: number) => [value, "Prospects"]}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("stats.activity.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("stats.activity.empty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {recentActivity.map((ev, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span>{EVENT_ICON[ev.eventType] ?? "•"}</span>
                    <span className="font-medium">{ev.prospectName}</span>
                    <span className="text-muted-foreground">
                      {t(
                        `stats.activity.${ev.eventType}` as Parameters<
                          typeof t
                        >[0],
                      )}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(ev.timestamp).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
