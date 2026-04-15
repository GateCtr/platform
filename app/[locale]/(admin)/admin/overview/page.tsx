import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import {
  Users,
  Clock,
  Mail,
  CheckCircle2,
  Ban,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { KpiGrid } from "@/components/admin/overview/kpi-grid";
import { SystemHealthSummary } from "@/components/admin/overview/system-health-summary";
import { SignupTrendChart } from "@/components/admin/overview/signup-trend-chart";
import { PlanDistributionChart } from "@/components/admin/overview/plan-distribution-chart";
import { WidgetErrorBoundary } from "@/components/admin/overview/error-boundary";
import { ReferralSourcesWidget } from "@/components/admin/launch/referral-sources";
import { fillTrendGaps, computePlanDistribution } from "@/lib/admin/utils";
import type { OverviewKpiPayload } from "@/app/api/admin/overview/route";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "adminOverview.metadata",
  });
  return { title: t("title") };
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchOverviewKpis(): Promise<OverviewKpiPayload> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const PLAN_PRICES_CENTS: Record<string, number> = {
    FREE: 0,
    PRO: 2900,
    TEAM: 9900,
    ENTERPRISE: 0,
  };

  const [activeUsers, subscriptionsByPlan, tokenAggregate] = await Promise.all([
    prisma.user.count({ where: { isActive: true, isBanned: false } }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { name: true } } },
    }),
    prisma.usageLog.aggregate({
      _sum: { totalTokens: true },
      where: { createdAt: { gte: startOfMonth } },
    }),
  ]);

  const mrrCents = subscriptionsByPlan.reduce((sum, sub) => {
    return sum + (PLAN_PRICES_CENTS[sub.plan.name] ?? 0);
  }, 0);

  return {
    activeUsers,
    activeSubscriptions: subscriptionsByPlan.length,
    mrrCents,
    tokensThisMonth: tokenAggregate._sum.totalTokens ?? 0,
  };
}

async function fetchChartData() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  const [rawSignupTrend, userPlans] = await Promise.all([
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT
        TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
        COUNT(*) AS count
      FROM users
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY day
      ORDER BY day ASC
    `,
    prisma.user.findMany({
      where: { isActive: true },
      select: { plan: true },
    }),
  ]);

  const signupTrend = fillTrendGaps(
    rawSignupTrend.map((r) => ({ day: r.day, count: Number(r.count) })),
    7,
  );

  const planDistribution = computePlanDistribution(
    userPlans.map((u) => u.plan),
  );

  return { signupTrend, planDistribution };
}

async function getWaitlistStats() {
  const [counts, last7Days] = await Promise.all([
    prisma.waitlistEntry.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT
        TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
        COUNT(*) AS count
      FROM waitlist_entries
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY day
      ORDER BY day ASC
    `,
  ]);

  const byStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all]),
  ) as Record<string, number>;

  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const waiting = byStatus["WAITING"] ?? 0;
  const invited = byStatus["INVITED"] ?? 0;
  const joined = byStatus["JOINED"] ?? 0;
  const skipped = byStatus["SKIPPED"] ?? 0;

  const pct = (n: number, d: number) =>
    d === 0 ? 0 : Math.round((n / d) * 100);

  const trendMap = new Map(last7Days.map((r) => [r.day, Number(r.count)]));
  const trend: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    trend.push({ day: key, count: trendMap.get(key) ?? 0 });
  }

  return {
    total,
    waiting,
    invited,
    joined,
    skipped,
    inviteRate: pct(invited + joined, total),
    joinRate: pct(joined, invited + joined),
    overallRate: pct(joined, total),
    trend,
  };
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconClass: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
      <div className={`mt-0.5 p-2 rounded-md ${iconClass}`}>
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tabular-nums leading-none">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {sub && (
          <span className="text-[11px] text-muted-foreground">{sub}</span>
        )}
      </div>
    </div>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function TrendBar({
  trend,
  todayLabel,
  trendLabel,
}: {
  trend: { day: string; count: number }[];
  todayLabel: string;
  trendLabel: string;
}) {
  const max = Math.max(...trend.map((t) => t.count), 1);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">{trendLabel}</span>
      <div className="flex items-end gap-1 h-10">
        {trend.map((t) => {
          const height = Math.max((t.count / max) * 100, t.count > 0 ? 8 : 2);
          const isToday = t.day === today;
          return (
            <div
              key={t.day}
              className="flex-1 flex flex-col items-center gap-0.5 group relative"
              title={`${t.day}: ${t.count}`}
            >
              <div
                className={`w-full rounded-sm transition-all ${
                  isToday
                    ? "bg-primary"
                    : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>{trend[0]?.day.slice(5)}</span>
        <span className="text-primary font-medium">{todayLabel}</span>
      </div>
    </div>
  );
}

// ─── Conversion bar ───────────────────────────────────────────────────────────

function ConversionRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-32 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-10 text-right">
        {value}%
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [t, kpis, chartData, waitlistStats] = await Promise.all([
    getTranslations({ locale, namespace: "adminOverview" }),
    fetchOverviewKpis().catch(() => null),
    fetchChartData().catch(() => null),
    getWaitlistStats(),
  ]);

  const tw = (key: string) => t(`waitlist.${key}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* KPI grid */}
      <WidgetErrorBoundary>
        <KpiGrid data={kpis ?? undefined} isLoading={false} />
      </WidgetErrorBoundary>

      {/* System health + charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* System health summary */}
        <WidgetErrorBoundary>
          <SystemHealthSummary />
        </WidgetErrorBoundary>

        {/* Signup trend chart */}
        <WidgetErrorBoundary>
          {chartData ? (
            <SignupTrendChart data={chartData.signupTrend} />
          ) : (
            <div className="flex items-center justify-center p-4 rounded-lg border border-border bg-card text-xs text-muted-foreground">
              {t("kpi.dataUnavailable")}
            </div>
          )}
        </WidgetErrorBoundary>

        {/* Plan distribution chart */}
        <WidgetErrorBoundary>
          {chartData ? (
            <PlanDistributionChart distribution={chartData.planDistribution} />
          ) : (
            <div className="flex items-center justify-center p-4 rounded-lg border border-border bg-card text-xs text-muted-foreground">
              {t("kpi.dataUnavailable")}
            </div>
          )}
        </WidgetErrorBoundary>
      </div>

      {/* Referral sources */}
      <WidgetErrorBoundary>
        <ReferralSourcesWidget />
      </WidgetErrorBoundary>

      {/* Waitlist funnel */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{tw("title")}</CardTitle>
          <CardDescription className="text-xs">
            {tw("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Stat grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              label={tw("total")}
              value={waitlistStats.total}
              icon={Users}
              iconClass="bg-muted text-muted-foreground"
            />
            <StatCard
              label={tw("waiting")}
              value={waitlistStats.waiting}
              icon={Clock}
              iconClass="bg-muted text-muted-foreground"
            />
            <StatCard
              label={tw("invited")}
              value={waitlistStats.invited}
              icon={Mail}
              iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
            <StatCard
              label={tw("joined")}
              value={waitlistStats.joined}
              icon={CheckCircle2}
              iconClass="bg-secondary-500/10 text-secondary-600 dark:text-secondary-400"
            />
            <StatCard
              label={tw("skipped")}
              value={waitlistStats.skipped}
              icon={Ban}
              iconClass="bg-destructive/10 text-destructive"
            />
          </div>

          {/* Conversion + trend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Conversion</span>
              </div>
              <ConversionRow
                label={tw("conversionInvited")}
                value={waitlistStats.inviteRate}
                color="bg-amber-500"
              />
              <ConversionRow
                label={tw("conversionJoined")}
                value={waitlistStats.joinRate}
                color="bg-secondary-500"
              />
              <ConversionRow
                label={tw("conversionOverall")}
                value={waitlistStats.overallRate}
                color="bg-primary"
              />
            </div>

            <TrendBar
              trend={waitlistStats.trend}
              todayLabel={tw("today")}
              trendLabel={tw("trend")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
