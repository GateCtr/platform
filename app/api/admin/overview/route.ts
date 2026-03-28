import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// Plan prices in cents — source of truth: config/product.ts + billing worker
const PLAN_PRICES_CENTS: Record<string, number> = {
  FREE: 0,
  PRO: 2900,
  TEAM: 9900,
  ENTERPRISE: 0, // custom pricing, excluded from MRR calc
};

export type OverviewKpiPayload = {
  activeUsers: number;
  activeSubscriptions: number;
  mrrCents: number;
  tokensThisMonth: number;
};

/**
 * GET /api/admin/overview
 * Returns platform-wide KPI stats for the admin overview page.
 * Requires: analytics:read permission
 */
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await getCurrentUser();
  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canRead = await hasPermission(currentUser.id, "analytics:read");
  if (!canRead)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [activeUsers, subscriptionsByPlan, tokenAggregate] = await Promise.all([
    // Active, non-banned users
    prisma.user.count({
      where: { isActive: true, isBanned: false },
    }),

    // Active subscriptions grouped by plan name for MRR calculation
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { name: true } } },
    }),

    // Total tokens processed this calendar month
    prisma.usageLog.aggregate({
      _sum: { totalTokens: true },
      where: { createdAt: { gte: startOfMonth } },
    }),
  ]);

  // Compute MRR from active subscriptions × plan price
  const mrrCents = subscriptionsByPlan.reduce((sum, sub) => {
    const planName = sub.plan.name as string;
    return sum + (PLAN_PRICES_CENTS[planName] ?? 0);
  }, 0);

  const payload: OverviewKpiPayload = {
    activeUsers,
    activeSubscriptions: subscriptionsByPlan.length,
    mrrCents,
    tokensThisMonth: tokenAggregate._sum.totalTokens ?? 0,
  };

  return NextResponse.json(payload);
}
