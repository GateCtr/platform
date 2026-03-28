import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { sortAlertsBySeverity, type AlertLike } from "@/lib/admin/utils";
import type { ActionResult } from "@/app/api/admin/feature-flags/[id]/route";

/**
 * GET /api/admin/notifications
 * Returns unacknowledged alerts (sorted by severity) + paginated history.
 * Supports ?severity=critical|warning|info and ?acknowledged=true|false filters.
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
  const severityFilter = searchParams.get("severity") ?? undefined;
  const acknowledgedParam = searchParams.get("acknowledged");
  const acknowledgedFilter =
    acknowledgedParam === "true"
      ? true
      : acknowledgedParam === "false"
        ? false
        : undefined;

  // Build shared where clause for history
  const historyWhere = {
    ...(severityFilter ? { severity: severityFilter } : {}),
    ...(acknowledgedFilter !== undefined
      ? { acknowledged: acknowledgedFilter }
      : {}),
  };

  const [unacknowledgedRaw, history] = await Promise.all([
    // Unacknowledged alerts — all of them, sorted in app code
    prisma.alert.findMany({
      where: {
        acknowledged: false,
        ...(severityFilter ? { severity: severityFilter } : {}),
      },
      include: { rule: { select: { name: true } } },
    }),

    // Alert history — last 100, filtered by query params
    prisma.alert.findMany({
      where: historyWhere,
      include: { rule: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  // Sort unacknowledged by severity (critical → warning → info) then createdAt desc
  const unacknowledged = sortAlertsBySeverity(
    unacknowledgedRaw as unknown as AlertLike[],
  );

  return NextResponse.json({ unacknowledged, history });
}

/**
 * PATCH /api/admin/notifications
 * Acknowledges a single alert by ID.
 * Body: { id: string }
 * Requires: analytics:write permission
 */
export async function PATCH(req: NextRequest) {
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

  const canWrite = await hasPermission(currentUser.id, "analytics:write");
  if (!canWrite)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 },
    );

  const body = (await req.json()) as { id?: string };
  if (!body.id)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Missing alert id", code: "VALIDATION" },
      { status: 422 },
    );

  const alert = await prisma.alert.findUnique({ where: { id: body.id } });
  if (!alert)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Alert not found", code: "NOT_FOUND" },
      { status: 404 },
    );

  const now = new Date();
  const updated = await prisma.alert.update({
    where: { id: body.id },
    data: {
      acknowledged: true,
      acknowledgedAt: now,
      acknowledgedBy: currentUser.id,
    },
  });

  void logAudit({
    actorId: currentUser.id,
    resource: "alert",
    action: "alert.acknowledged",
    resourceId: body.id,
    oldValue: { acknowledged: false },
    newValue: {
      acknowledged: true,
      acknowledgedAt: now.toISOString(),
      acknowledgedBy: currentUser.id,
    },
    success: true,
  });

  return NextResponse.json<ActionResult<typeof updated>>({
    success: true,
    data: updated,
  });
}

/**
 * POST /api/admin/notifications
 * Bulk-acknowledges all unacknowledged alerts.
 * Body: { action: "acknowledge-all" }
 * Requires: analytics:write permission
 */
export async function POST(req: NextRequest) {
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

  const canWrite = await hasPermission(currentUser.id, "analytics:write");
  if (!canWrite)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 },
    );

  const body = (await req.json()) as { action?: string };
  if (body.action !== "acknowledge-all")
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Unknown action", code: "VALIDATION" },
      { status: 422 },
    );

  const now = new Date();
  const result = await prisma.alert.updateMany({
    where: { acknowledged: false },
    data: {
      acknowledged: true,
      acknowledgedAt: now,
      acknowledgedBy: currentUser.id,
    },
  });

  void logAudit({
    actorId: currentUser.id,
    resource: "alert",
    action: "alert.acknowledged_all",
    newValue: { count: result.count, acknowledgedAt: now.toISOString() },
    success: true,
  });

  return NextResponse.json<ActionResult<{ count: number }>>({
    success: true,
    data: { count: result.count },
  });
}
