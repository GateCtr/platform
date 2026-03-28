"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, getCurrentUser } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { logAudit } from "@/lib/audit";

export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code: "FORBIDDEN" | "VALIDATION" | "NOT_FOUND" | "INTERNAL";
    };

/**
 * Acknowledge a single alert by ID.
 * Requires: analytics:write permission
 */
export async function acknowledgeAlert(
  id: string,
): Promise<ActionResult<{ id: string; acknowledged: boolean }>> {
  try {
    await validateCsrf();
    await requirePermission("analytics:write");
    const actor = await getCurrentUser();
    if (!actor)
      return { success: false, error: "Unauthorized", code: "FORBIDDEN" };

    const existing = await prisma.alert.findUnique({ where: { id } });
    if (!existing)
      return { success: false, error: "Alert not found", code: "NOT_FOUND" };

    const now = new Date();
    const updated = await prisma.alert.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: now,
        acknowledgedBy: actor.id,
      },
    });

    void logAudit({
      actorId: actor.id,
      resource: "alert",
      action: "alert.acknowledged",
      resourceId: id,
      oldValue: { acknowledged: false },
      newValue: {
        acknowledged: true,
        acknowledgedAt: now.toISOString(),
        acknowledgedBy: actor.id,
      },
      success: true,
    });

    return { success: true, data: { id: updated.id, acknowledged: updated.acknowledged } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg.includes("permission") || msg.includes("Unauthorized")) {
      return { success: false, error: msg, code: "FORBIDDEN" };
    }
    return { success: false, error: msg, code: "INTERNAL" };
  }
}

/**
 * Bulk-acknowledge all unacknowledged alerts.
 * Requires: analytics:write permission
 */
export async function acknowledgeAllAlerts(): Promise<
  ActionResult<{ count: number }>
> {
  try {
    await validateCsrf();
    await requirePermission("analytics:write");
    const actor = await getCurrentUser();
    if (!actor)
      return { success: false, error: "Unauthorized", code: "FORBIDDEN" };

    const now = new Date();
    const result = await prisma.alert.updateMany({
      where: { acknowledged: false },
      data: {
        acknowledged: true,
        acknowledgedAt: now,
        acknowledgedBy: actor.id,
      },
    });

    void logAudit({
      actorId: actor.id,
      resource: "alert",
      action: "alert.acknowledged_all",
      newValue: { count: result.count, acknowledgedAt: now.toISOString() },
      success: true,
    });

    return { success: true, data: { count: result.count } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg.includes("permission") || msg.includes("Unauthorized")) {
      return { success: false, error: msg, code: "FORBIDDEN" };
    }
    return { success: false, error: msg, code: "INTERNAL" };
  }
}
