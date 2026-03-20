import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plan-guard";

export async function GET(): Promise<NextResponse> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, plan: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [agg, limits] = await Promise.all([
    prisma.dailyUsageCache.aggregate({
      where: { userId: user.id, date: { startsWith: monthStart } },
      _sum: { totalTokens: true },
    }),
    getPlanLimits(user.plan),
  ]);

  return NextResponse.json({
    plan: user.plan,
    tokensUsed: agg._sum.totalTokens ?? 0,
    tokensLimit: limits?.maxTokensPerMonth ?? null,
  });
}
