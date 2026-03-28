import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { fillTrendGaps, computePctChange, topN } from "@/lib/admin/utils";

type RangeOption = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<RangeOption, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function getRangeStart(range: RangeOption): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - RANGE_DAYS[range]);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getPreviousRangeStart(range: RangeOption): Date {
  const d = new Date();
  const days = RANGE_DAYS[range];
  d.setUTCDate(d.getUTCDate() - days * 2);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export type AnalyticsPayload = {
  range: RangeOption;
  tokens: {
    current: number;
    previous: number;
    pctChange: number;
    savedByOptimizer: number;
  };
  dailyTrend: { day: string; count: number }[];
  byProvider: { provider: string; tokens: number }[];
  byModel: {
    model: string;
    provider: string;
    tokens: number;
    pctOfTotal: number;
  }[];
  topUsers: {
    userId: string;
    tokens: number;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    plan: string;
  }[];
  dau: number;
  mau: number;
};

/**
 * GET /api/admin/analytics
 * Returns platform-wide analytics for the selected range (7d/30d/90d).
 * Supports ?export=csv to stream a CSV summary.
 * Requires: analytics:read permission
 */
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await getCurrentUser();
  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canRead = await hasPermission(currentUser.id, "analytics:read");
  if (!canRead)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const rawRange = searchParams.get("range") ?? "30d";
  const range: RangeOption =
    rawRange === "7d" || rawRange === "90d" ? rawRange : "30d";
  const exportCsv = searchParams.get("export") === "csv";

  const rangeStart = getRangeStart(range);
  const prevStart = getPreviousRangeStart(range);
  const nDays = RANGE_DAYS[range];

  const now = new Date();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

  const [
    currentAgg,
    previousAgg,
    savedAgg,
    dailyRaw,
    byProviderRaw,
    byModelRaw,
    topUsersRaw,
    dauRaw,
    mauRaw,
  ] = await Promise.all([
    // Current period total tokens
    prisma.usageLog.aggregate({
      _sum: { totalTokens: true },
      where: { createdAt: { gte: rangeStart } },
    }),

    // Previous period total tokens (for pct change)
    prisma.usageLog.aggregate({
      _sum: { totalTokens: true },
      where: { createdAt: { gte: prevStart, lt: rangeStart } },
    }),

    // Tokens saved by optimizer in current period
    prisma.usageLog.aggregate({
      _sum: { savedTokens: true },
      where: { createdAt: { gte: rangeStart }, optimized: true },
    }),

    // Daily token trend — raw SQL for date grouping
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
             SUM("totalTokens") AS count
      FROM usage_logs
      WHERE "createdAt" >= ${rangeStart}
      GROUP BY day
      ORDER BY day ASC
    `,

    // Provider breakdown
    prisma.usageLog.groupBy({
      by: ["provider"],
      _sum: { totalTokens: true },
      where: { createdAt: { gte: rangeStart } },
      orderBy: { _sum: { totalTokens: "desc" } },
    }),

    // Model breakdown — top 10
    prisma.usageLog.groupBy({
      by: ["model", "provider"],
      _sum: { totalTokens: true },
      where: { createdAt: { gte: rangeStart } },
      orderBy: { _sum: { totalTokens: "desc" } },
      take: 10,
    }),

    // Top users by token consumption
    prisma.usageLog.groupBy({
      by: ["userId"],
      _sum: { totalTokens: true },
      where: { createdAt: { gte: rangeStart } },
      orderBy: { _sum: { totalTokens: "desc" } },
      take: 10,
    }),

    // DAU — distinct users with activity today
    prisma.usageLog.findMany({
      where: { createdAt: { gte: new Date(now.toISOString().slice(0, 10)) } },
      select: { userId: true },
      distinct: ["userId"],
    }),

    // MAU — distinct users with activity in last 30 days
    prisma.usageLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const currentTokens = currentAgg._sum.totalTokens ?? 0;
  const previousTokens = previousAgg._sum.totalTokens ?? 0;

  // Fill gaps so trend always has exactly nDays points
  const dailyTrend = fillTrendGaps(
    dailyRaw.map((r) => ({ day: r.day, count: Number(r.count) })),
    nDays,
  );

  // Provider breakdown
  const byProvider = byProviderRaw.map((r) => ({
    provider: r.provider,
    tokens: r._sum.totalTokens ?? 0,
  }));

  // Model breakdown with % of total
  const byModel = byModelRaw.map((r) => ({
    model: r.model,
    provider: r.provider,
    tokens: r._sum.totalTokens ?? 0,
    pctOfTotal:
      currentTokens > 0
        ? parseFloat(
            (((r._sum.totalTokens ?? 0) / currentTokens) * 100).toFixed(1),
          )
        : 0,
  }));

  // Top users — enrich with user profile data
  const topUserIds = topUsersRaw.map((r) => r.userId);
  const userProfiles = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, email: true, avatarUrl: true, plan: true },
  });
  const profileMap = new Map(userProfiles.map((u) => [u.id, u]));

  const topUsers = topN(
    topUsersRaw.map((r) => {
      const profile = profileMap.get(r.userId);
      return {
        userId: r.userId,
        tokens: r._sum.totalTokens ?? 0,
        name: profile?.name ?? null,
        email: profile?.email ?? r.userId,
        avatarUrl: profile?.avatarUrl ?? null,
        plan: profile?.plan ?? "FREE",
      };
    }),
    10,
  );

  const payload: AnalyticsPayload = {
    range,
    tokens: {
      current: currentTokens,
      previous: previousTokens,
      pctChange:
        previousTokens > 0
          ? computePctChange(currentTokens, previousTokens)
          : 0,
      savedByOptimizer: savedAgg._sum.savedTokens ?? 0,
    },
    dailyTrend,
    byProvider,
    byModel,
    topUsers,
    dau: dauRaw.length,
    mau: mauRaw.length,
  };

  // CSV export
  if (exportCsv) {
    const lines: string[] = [
      "metric,value",
      `range,${range}`,
      `tokens_current,${payload.tokens.current}`,
      `tokens_previous,${payload.tokens.previous}`,
      `tokens_pct_change,${payload.tokens.pctChange}`,
      `tokens_saved_by_optimizer,${payload.tokens.savedByOptimizer}`,
      `dau,${payload.dau}`,
      `mau,${payload.mau}`,
      "",
      "day,tokens",
      ...payload.dailyTrend.map((d) => `${d.day},${d.count}`),
      "",
      "provider,tokens",
      ...payload.byProvider.map((p) => `${p.provider},${p.tokens}`),
      "",
      "model,provider,tokens,pct_of_total",
      ...payload.byModel.map(
        (m) => `${m.model},${m.provider},${m.tokens},${m.pctOfTotal}`,
      ),
    ];

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(payload);
}
