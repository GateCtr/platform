import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redis } from "@/lib/redis";
import { logAudit } from "@/lib/audit";
import { validateRolloutPct } from "@/lib/admin/utils";

export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code: "FORBIDDEN" | "VALIDATION" | "NOT_FOUND" | "INTERNAL";
    };

/**
 * PATCH /api/admin/feature-flags/[id]
 * Updates a feature flag's enabled state, rollout percentage, or enabled plans.
 * Requires: system:write permission
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Unauthorized", code: "FORBIDDEN" },
      { status: 401 },
    );

  const currentUser = await getCurrentUser();
  if (!currentUser)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Unauthorized", code: "FORBIDDEN" },
      { status: 401 },
    );

  const canWrite = await hasPermission(currentUser.id, "system:write");
  if (!canWrite)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 },
    );

  // Fetch existing flag
  const existing = await prisma.featureFlag.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Feature flag not found", code: "NOT_FOUND" },
      { status: 404 },
    );

  const body = (await req.json()) as {
    enabled?: boolean;
    rolloutPct?: number;
    enabledPlans?: string[];
  };

  // Validate rolloutPct if provided
  if (body.rolloutPct !== undefined) {
    const validation = validateRolloutPct(body.rolloutPct);
    if (!validation.valid) {
      return NextResponse.json<ActionResult<never>>(
        { success: false, error: validation.error, code: "VALIDATION" },
        { status: 422 },
      );
    }
  }

  // Build update payload with only provided fields
  const updateData: {
    enabled?: boolean;
    rolloutPct?: number;
    enabledPlans?: string[];
  } = {};
  if (body.enabled !== undefined) updateData.enabled = body.enabled;
  if (body.rolloutPct !== undefined) updateData.rolloutPct = body.rolloutPct;
  if (body.enabledPlans !== undefined)
    updateData.enabledPlans = body.enabledPlans;

  const updated = await prisma.featureFlag.update({
    where: { id },
    data: updateData,
  });

  // Invalidate Redis cache for all users who have this flag cached
  // Pattern: feature_flag:{userId}:{flagKey}
  try {
    const overrides = await prisma.featureFlagOverride.findMany({
      where: { featureFlagId: id },
      select: { userId: true },
    });
    const pipeline = redis.pipeline();
    for (const { userId } of overrides) {
      pipeline.del(`feature_flag:${userId}:${existing.key}`);
    }
    await pipeline.exec();
  } catch (err) {
    console.error("Redis cache invalidation error:", err);
  }

  // Fire-and-forget audit log
  void logAudit({
    actorId: currentUser.id,
    resource: "feature_flag",
    action: "feature_flag.updated",
    resourceId: id,
    oldValue: {
      enabled: existing.enabled,
      rolloutPct: existing.rolloutPct,
      enabledPlans: existing.enabledPlans,
    },
    newValue: {
      enabled: updated.enabled,
      rolloutPct: updated.rolloutPct,
      enabledPlans: updated.enabledPlans,
    },
    success: true,
  });

  return NextResponse.json<ActionResult<typeof updated>>({
    success: true,
    data: updated,
  });
}
