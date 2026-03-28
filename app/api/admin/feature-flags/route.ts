import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

/**
 * GET /api/admin/feature-flags
 * Returns all feature flags with override counts, ordered by key.
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

  const flags = await prisma.featureFlag.findMany({
    include: { _count: { select: { overrides: true } } },
    orderBy: { key: "asc" },
  });

  return NextResponse.json(flags);
}
