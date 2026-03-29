import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export type SystemStatsPayload = {
  totalRequests24h: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  errorRatePct: number;
  cacheHitRatePct: number;
};

/**
 * GET /api/admin/system/stats
 * Returns platform-wide stats for the last 24h: request count, p50/p95 latency,
 * error rate %, and cache hit rate % derived from UsageLog aggregates.
 * Requires: system:read permission
 */
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await getCurrentUser();
  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canRead = await hasPermission(currentUser.id, "system:read");
  if (!canRead)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const since = new Date(Date.now() - 86_400_000);

  const logs = await prisma.usageLog.findMany({
    where: { createdAt: { gte: since } },
    select: { latencyMs: true, statusCode: true, cachedResponse: true },
    orderBy: { latencyMs: "asc" },
  });

  const totalRequests24h = logs.length;

  if (totalRequests24h === 0) {
    return NextResponse.json<SystemStatsPayload>({
      totalRequests24h: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      errorRatePct: 0,
      cacheHitRatePct: 0,
    });
  }

  // Latency percentiles — logs already sorted asc by latencyMs
  const p50Index = Math.floor(totalRequests24h * 0.5);
  const p95Index = Math.floor(totalRequests24h * 0.95);
  const p50LatencyMs = logs[p50Index]?.latencyMs ?? 0;
  const p95LatencyMs = logs[p95Index]?.latencyMs ?? 0;

  // Error rate: status codes >= 400
  const errorCount = logs.filter((l) => l.statusCode >= 400).length;
  const errorRatePct = parseFloat(
    ((errorCount / totalRequests24h) * 100).toFixed(1),
  );

  // Cache hit rate
  const cacheHitCount = logs.filter((l) => l.cachedResponse).length;
  const cacheHitRatePct = parseFloat(
    ((cacheHitCount / totalRequests24h) * 100).toFixed(1),
  );

  return NextResponse.json<SystemStatsPayload>({
    totalRequests24h,
    p50LatencyMs,
    p95LatencyMs,
    errorRatePct,
    cacheHitRatePct,
  });
}
