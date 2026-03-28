"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { logAudit } from "@/lib/audit";
import { validateRolloutPct } from "@/lib/admin/utils";
import { redis } from "@/lib/redis";
import { getCurrentUser } from "@/lib/auth";

export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code: "FORBIDDEN" | "VALIDATION" | "NOT_FOUND" | "INTERNAL";
    };

// ─── Cache invalidation helper ────────────────────────────────────────────────

async function invalidateFlagCache(flagId: string, flagKey: string) {
  try {
    const overrides = await prisma.featureFlagOverride.findMany({
      where: { featureFlagId: flagId },
      select: { userId: true },
    });
    if (overrides.length > 0) {
      const pipeline = redis.pipeline();
      for (const { userId } of overrides) {
        pipeline.del(`feature_flag:${userId}:${flagKey}`);
      }
      await pipeline.exec();
    }
  } catch (err) {
    console.error("Redis cache invalidation error:", err);
  }
}

// ─── toggleFlag ───────────────────────────────────────────────────────────────

export async function toggleFlag(
  flagId: string,
  enabled: boolean,
): Promise<ActionResult<{ id: string; enabled: boolean }>> {
  try {
    await validateCsrf();
    await requirePermission("system:write");
    const actor = await getCurrentUser();
    if (!actor) return { success: false, error: "Unauthorized", code: "FORBIDDEN" };

    const existing = await prisma.featureFlag.findUnique({ where: { id: flagId } });
    if (!existing) return { success: false, error: "Feature flag not found", code: "NOT_FOUND" };

    const updated = await prisma.featureFlag.update({
      where: { id: flagId },
      data: { enabled },
    });

    await invalidateFlagCache(flagId, existing.key);

    void logAudit({
      actorId: actor.id,
      resource: "feature_flag",
      action: "feature_flag.toggled",
      resourceId: flagId,
      oldValue: { enabled: existing.enabled },
      newValue: { enabled: updated.enabled },
      success: true,
    });

    return { success: true, data: { id: updated.id, enabled: updated.enabled } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg.includes("permission") || msg.includes("Unauthorized")) {
      return { success: false, error: msg, code: "FORBIDDEN" };
    }
    return { success: false, error: msg, code: "INTERNAL" };
  }
}

// ─── updateRollout ────────────────────────────────────────────────────────────

export async function updateRollout(
  flagId: string,
  rolloutPct: number,
): Promise<ActionResult<{ id: string; rolloutPct: number }>> {
  try {
    await validateCsrf();
    await requirePermission("system:write");
    const actor = await getCurrentUser();
    if (!actor) return { success: false, error: "Unauthorized", code: "FORBIDDEN" };

    const validation = validateRolloutPct(rolloutPct);
    if (!validation.valid) {
      return { success: false, error: validation.error, code: "VALIDATION" };
    }

    const existing = await prisma.featureFlag.findUnique({ where: { id: flagId } });
    if (!existing) return { success: false, error: "Feature flag not found", code: "NOT_FOUND" };

    const updated = await prisma.featureFlag.update({
      where: { id: flagId },
      data: { rolloutPct },
    });

    await invalidateFlagCache(flagId, existing.key);

    void logAudit({
      actorId: actor.id,
      resource: "feature_flag",
      action: "feature_flag.rollout_updated",
      resourceId: flagId,
      oldValue: { rolloutPct: existing.rolloutPct },
      newValue: { rolloutPct: updated.rolloutPct },
      success: true,
    });

    return { success: true, data: { id: updated.id, rolloutPct: updated.rolloutPct } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg.includes("permission") || msg.includes("Unauthorized")) {
      return { success: false, error: msg, code: "FORBIDDEN" };
    }
    return { success: false, error: msg, code: "INTERNAL" };
  }
}

// ─── updateEnabledPlans ───────────────────────────────────────────────────────

export async function updateEnabledPlans(
  flagId: string,
  enabledPlans: string[],
): Promise<ActionResult<{ id: string; enabledPlans: string[] }>> {
  try {
    await validateCsrf();
    await requirePermission("system:write");
    const actor = await getCurrentUser();
    if (!actor) return { success: false, error: "Unauthorized", code: "FORBIDDEN" };

    const existing = await prisma.featureFlag.findUnique({ where: { id: flagId } });
    if (!existing) return { success: false, error: "Feature flag not found", code: "NOT_FOUND" };

    const updated = await prisma.featureFlag.update({
      where: { id: flagId },
      data: { enabledPlans },
    });

    await invalidateFlagCache(flagId, existing.key);

    void logAudit({
      actorId: actor.id,
      resource: "feature_flag",
      action: "feature_flag.plans_updated",
      resourceId: flagId,
      oldValue: { enabledPlans: existing.enabledPlans },
      newValue: { enabledPlans: updated.enabledPlans },
      success: true,
    });

    return { success: true, data: { id: updated.id, enabledPlans: updated.enabledPlans } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg.includes("permission") || msg.includes("Unauthorized")) {
      return { success: false, error: msg, code: "FORBIDDEN" };
    }
    return { success: false, error: msg, code: "INTERNAL" };
  }
}

// ─── addOverride ──────────────────────────────────────────────────────────────

export async function addOverride(
  flagId: string,
  userEmail: string,
  enabled: boolean,
): Promise<ActionResult<{ id: string; userId: string; enabled: boolean }>> {
  try {
    await validateCsrf();
    await requirePermission("system:write");
    const actor = await getCurrentUser();
    if (!actor) return { success: false, error: "Unauthorized", code: "FORBIDDEN" };

    const flag = await prisma.featureFlag.findUnique({ where: { id: flagId } });
    if (!flag) return { success: false, error: "Feature flag not found", code: "NOT_FOUND" };

    const targetUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    if (!targetUser) {
      return { success: false, error: "No user found with that email.", code: "NOT_FOUND" };
    }

    const override = await prisma.featureFlagOverride.upsert({
      where: { featureFlagId_userId: { featureFlagId: flagId, userId: targetUser.id } },
      create: { featureFlagId: flagId, userId: targetUser.id, enabled },
      update: { enabled },
    });

    // Invalidate cache for this specific user
    try {
      await redis.del(`feature_flag:${targetUser.id}:${flag.key}`);
    } catch (err) {
      console.error("Redis cache invalidation error:", err);
    }

    void logAudit({
      actorId: actor.id,
      resource: "feature_flag_override",
      action: "feature_flag_override.created",
      resourceId: override.id,
      newValue: { flagId, userId: targetUser.id, enabled },
      success: true,
    });

    return { success: true, data: { id: override.id, userId: override.userId, enabled: override.enabled } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg.includes("permission") || msg.includes("Unauthorized")) {
      return { success: false, error: msg, code: "FORBIDDEN" };
    }
    return { success: false, error: msg, code: "INTERNAL" };
  }
}

// ─── removeOverride ───────────────────────────────────────────────────────────

export async function removeOverride(
  overrideId: string,
): Promise<ActionResult<{ deleted: true }>> {
  try {
    await validateCsrf();
    await requirePermission("system:write");
    const actor = await getCurrentUser();
    if (!actor) return { success: false, error: "Unauthorized", code: "FORBIDDEN" };

    const override = await prisma.featureFlagOverride.findUnique({
      where: { id: overrideId },
      include: { featureFlag: { select: { key: true } } },
    });
    if (!override) return { success: false, error: "Override not found", code: "NOT_FOUND" };

    await prisma.featureFlagOverride.delete({ where: { id: overrideId } });

    // Invalidate cache for this specific user
    try {
      await redis.del(`feature_flag:${override.userId}:${override.featureFlag.key}`);
    } catch (err) {
      console.error("Redis cache invalidation error:", err);
    }

    void logAudit({
      actorId: actor.id,
      resource: "feature_flag_override",
      action: "feature_flag_override.deleted",
      resourceId: overrideId,
      oldValue: { flagId: override.featureFlagId, userId: override.userId, enabled: override.enabled },
      success: true,
    });

    return { success: true, data: { deleted: true } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg.includes("permission") || msg.includes("Unauthorized")) {
      return { success: false, error: msg, code: "FORBIDDEN" };
    }
    return { success: false, error: msg, code: "INTERNAL" };
  }
}
