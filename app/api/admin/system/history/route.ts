import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export type ServiceHistoryEntry = {
  id: string;
  status: string;
  latencyMs: number | null;
  errorMessage: string | null;
  checkedAt: Date;
};

export type SystemHistoryPayload = {
  [service: string]: ServiceHistoryEntry[];
};

/**
 * GET /api/admin/system/history
 * Returns the last 24h of SystemHealth records grouped by service,
 * ordered by checkedAt asc within each group.
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

  const records = await prisma.systemHealth.findMany({
    where: { checkedAt: { gte: since } },
    orderBy: { checkedAt: "asc" },
    select: {
      id: true,
      service: true,
      status: true,
      latencyMs: true,
      errorMessage: true,
      checkedAt: true,
    },
  });

  // Group by service in application code
  const grouped = records.reduce<SystemHistoryPayload>((acc, record) => {
    if (!acc[record.service]) acc[record.service] = [];
    acc[record.service].push({
      id: record.id,
      status: record.status,
      latencyMs: record.latencyMs,
      errorMessage: record.errorMessage,
      checkedAt: record.checkedAt,
    });
    return acc;
  }, {});

  return NextResponse.json<SystemHistoryPayload>(grouped);
}
