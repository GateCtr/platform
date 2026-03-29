import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "../route";

/**
 * GET /api/admin/feature-flags/[id]/overrides
 * Lists all per-user overrides for a feature flag.
 * Requires: system:read permission
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await getCurrentUser();
  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canRead = await hasPermission(currentUser.id, "system:read");
  if (!canRead)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const overrides = await prisma.featureFlagOverride.findMany({
    where: { featureFlagId: id },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(overrides);
}

/**
 * POST /api/admin/feature-flags/[id]/overrides
 * Creates a per-user override for a feature flag.
 * Body: { email: string; enabled: boolean; reason?: string }
 * Requires: system:write permission
 */
export async function POST(
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

  const flag = await prisma.featureFlag.findUnique({ where: { id } });
  if (!flag)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Feature flag not found", code: "NOT_FOUND" },
      { status: 404 },
    );

  const body = (await req.json()) as {
    email: string;
    enabled: boolean;
    reason?: string;
  };

  if (!body.email)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "email is required", code: "VALIDATION" },
      { status: 422 },
    );

  // Resolve user by email
  const targetUser = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true },
  });
  if (!targetUser)
    return NextResponse.json<ActionResult<never>>(
      {
        success: false,
        error: "No user found with that email.",
        code: "NOT_FOUND",
      },
      { status: 404 },
    );

  const override = await prisma.featureFlagOverride.upsert({
    where: {
      featureFlagId_userId: { featureFlagId: id, userId: targetUser.id },
    },
    create: {
      featureFlagId: id,
      userId: targetUser.id,
      enabled: body.enabled,
      reason: body.reason,
    },
    update: {
      enabled: body.enabled,
      reason: body.reason,
    },
  });

  void logAudit({
    actorId: currentUser.id,
    resource: "feature_flag_override",
    action: "feature_flag_override.created",
    resourceId: override.id,
    newValue: { flagId: id, userId: targetUser.id, enabled: body.enabled },
    success: true,
  });

  return NextResponse.json<ActionResult<typeof override>>(
    { success: true, data: override },
    { status: 201 },
  );
}

/**
 * DELETE /api/admin/feature-flags/[id]/overrides
 * Removes a per-user override by override id.
 * Body: { overrideId: string }
 * Requires: system:write permission
 */
export async function DELETE(
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

  const body = (await req.json()) as { overrideId: string };
  if (!body.overrideId)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "overrideId is required", code: "VALIDATION" },
      { status: 422 },
    );

  const override = await prisma.featureFlagOverride.findUnique({
    where: { id: body.overrideId },
  });
  if (!override || override.featureFlagId !== id)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Override not found", code: "NOT_FOUND" },
      { status: 404 },
    );

  await prisma.featureFlagOverride.delete({ where: { id: body.overrideId } });

  void logAudit({
    actorId: currentUser.id,
    resource: "feature_flag_override",
    action: "feature_flag_override.deleted",
    resourceId: body.overrideId,
    oldValue: {
      flagId: id,
      userId: override.userId,
      enabled: override.enabled,
    },
    success: true,
  });

  return NextResponse.json<ActionResult<{ deleted: true }>>({
    success: true,
    data: { deleted: true },
  });
}
