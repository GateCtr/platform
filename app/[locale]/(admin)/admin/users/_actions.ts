"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { invalidatePermissionCache } from "@/lib/permissions";
import {
  sendUserSuspendedEmail,
  sendUserBannedEmail,
  sendUserReactivatedEmail,
  sendUserDeletedEmail,
} from "@/lib/resend";
import { validateCsrf } from "@/lib/csrf";
import type { RoleName } from "@/types/globals";

// ─── Guards ───────────────────────────────────────────────────────────────────

async function assertAdmin() {
  const { sessionClaims, userId } = await auth();
  const role = sessionClaims?.publicMetadata?.role as RoleName | undefined;
  const adminRoles: RoleName[] = ["SUPER_ADMIN", "ADMIN"];
  if (!userId || !role || !adminRoles.includes(role)) {
    throw new Error("Not Authorized");
  }
  return userId;
}

async function getDbUser(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error("User not found");
  return user;
}

/** Fetch primary email + name from Clerk */
async function getClerkContact(
  clerkId: string,
): Promise<{ email: string; name: string | null; locale: "en" | "fr" }> {
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = clerkUser.firstName
    ? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ""}`
    : null;
  const locale =
    ((clerkUser.publicMetadata as Record<string, unknown>)?.locale as
      | "en"
      | "fr") ?? "en";
  return { email, name, locale };
}

// ─── Set role ─────────────────────────────────────────────────────────────────

export async function setRole(formData: FormData) {
  try {
    await validateCsrf();
    const actorId = await assertAdmin();
    const clerkId = formData.get("clerkId") as string;
    const roleName = formData.get("role") as RoleName;
    if (!clerkId || !roleName) return { error: "Missing required fields" };

    const user = await getDbUser(clerkId);
    const roleRecord = await prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!roleRecord) return { error: "Role not found" };

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: user.id } }),
      prisma.userRole.create({
        data: { userId: user.id, roleId: roleRecord.id },
      }),
    ]);

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const existing =
      (clerkUser.publicMetadata as Record<string, unknown>) ?? {};
    await client.users.updateUser(clerkId, {
      publicMetadata: { ...existing, role: roleName },
    });

    await invalidatePermissionCache(user.id);
    await logAudit({
      userId: user.id,
      actorId,
      resource: "user",
      action: "role.granted",
      resourceId: user.id,
      newValue: { role: roleName },
      success: true,
    });
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Remove role ──────────────────────────────────────────────────────────────

export async function removeRole(formData: FormData) {
  try {
    await validateCsrf();
    const actorId = await assertAdmin();
    const clerkId = formData.get("clerkId") as string;
    if (!clerkId) return { error: "Missing clerkId" };

    const user = await getDbUser(clerkId);
    const developerRole = await prisma.role.findUnique({
      where: { name: "DEVELOPER" },
    });
    if (!developerRole) return { error: "DEVELOPER role not found" };

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: user.id } }),
      prisma.userRole.create({
        data: { userId: user.id, roleId: developerRole.id },
      }),
    ]);

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const existing =
      (clerkUser.publicMetadata as Record<string, unknown>) ?? {};
    await client.users.updateUser(clerkId, {
      publicMetadata: { ...existing, role: "DEVELOPER" },
    });

    await invalidatePermissionCache(user.id);
    await logAudit({
      userId: user.id,
      actorId,
      resource: "user",
      action: "role.revoked",
      resourceId: user.id,
      newValue: { role: "DEVELOPER" },
      success: true,
    });
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Suspend / Reactivate ─────────────────────────────────────────────────────

export async function suspendUser(formData: FormData) {
  try {
    await validateCsrf();
    const actorId = await assertAdmin();
    const clerkId = formData.get("clerkId") as string;
    if (!clerkId) return { error: "Missing clerkId" };

    const user = await getDbUser(clerkId);
    const { email, name, locale } = await getClerkContact(clerkId);

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    });

    const client = await clerkClient();
    await client.users.banUser(clerkId);

    await invalidatePermissionCache(user.id);
    await logAudit({
      userId: user.id,
      actorId,
      resource: "user",
      action: "user.suspended",
      resourceId: user.id,
      success: true,
    });

    if (email) await sendUserSuspendedEmail(email, name, locale);

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function reactivateUser(formData: FormData) {
  try {
    await validateCsrf();
    const actorId = await assertAdmin();
    const clerkId = formData.get("clerkId") as string;
    if (!clerkId) return { error: "Missing clerkId" };

    const user = await getDbUser(clerkId);
    const { email, name, locale } = await getClerkContact(clerkId);

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true, isBanned: false, bannedReason: null },
    });

    const client = await clerkClient();
    await client.users.unbanUser(clerkId);

    await invalidatePermissionCache(user.id);
    await logAudit({
      userId: user.id,
      actorId,
      resource: "user",
      action: "user.reactivated",
      resourceId: user.id,
      success: true,
    });

    if (email) await sendUserReactivatedEmail(email, name, locale);

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Ban ──────────────────────────────────────────────────────────────────────

export async function banUser(formData: FormData) {
  try {
    await validateCsrf();
    const actorId = await assertAdmin();
    const clerkId = formData.get("clerkId") as string;
    const reason =
      (formData.get("reason") as string) || "Violation of terms of service";
    if (!clerkId) return { error: "Missing clerkId" };

    const user = await getDbUser(clerkId);
    const { email, name, locale } = await getClerkContact(clerkId);

    await prisma.user.update({
      where: { id: user.id },
      data: { isBanned: true, isActive: false, bannedReason: reason },
    });

    const client = await clerkClient();
    await client.users.banUser(clerkId);

    await invalidatePermissionCache(user.id);
    await logAudit({
      userId: user.id,
      actorId,
      resource: "user",
      action: "user.banned",
      resourceId: user.id,
      newValue: { reason },
      success: true,
    });

    if (email) await sendUserBannedEmail(email, name, reason, locale);

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Force sign-out ───────────────────────────────────────────────────────────

export async function forceSignOut(formData: FormData) {
  try {
    await validateCsrf();
    const actorId = await assertAdmin();
    const clerkId = formData.get("clerkId") as string;
    if (!clerkId) return { error: "Missing clerkId" };

    const user = await getDbUser(clerkId);
    const client = await clerkClient();

    // Revoke all active sessions
    const { data: sessions } = await client.sessions.getSessionList({
      userId: clerkId,
      status: "active",
    });
    await Promise.all(
      sessions.map((s: { id: string }) => client.sessions.revokeSession(s.id)),
    );

    await logAudit({
      userId: user.id,
      actorId,
      resource: "user",
      action: "user.sessions_revoked",
      resourceId: user.id,
      success: true,
    });
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Delete user ──────────────────────────────────────────────────────────────

export async function deleteUser(formData: FormData) {
  try {
    const actorId = await assertAdmin();
    const clerkId = formData.get("clerkId") as string;
    if (!clerkId) return { error: "Missing clerkId" };

    const user = await getDbUser(clerkId);

    // Fetch contact BEFORE deleting — Clerk user won't exist after
    const { email, name, locale } = await getClerkContact(clerkId);

    // Send email before deletion so the address is still valid
    if (email) await sendUserDeletedEmail(email, name, locale);

    const client = await clerkClient();
    await client.users.deleteUser(clerkId);

    await prisma.user.delete({ where: { id: user.id } });

    await logAudit({
      actorId,
      resource: "user",
      action: "user.deleted",
      resourceId: user.id,
      success: true,
    });
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Change plan ──────────────────────────────────────────────────────────────

export async function changePlan(formData: FormData) {
  try {
    const actorId = await assertAdmin();
    const clerkId = formData.get("clerkId") as string;
    const plan = formData.get("plan") as string;
    if (!clerkId || !plan) return { error: "Missing required fields" };

    const validPlans = ["FREE", "PRO", "TEAM", "ENTERPRISE"];
    if (!validPlans.includes(plan)) return { error: "Invalid plan" };

    const user = await getDbUser(clerkId);
    const oldPlan = user.plan;

    await prisma.user.update({
      where: { id: user.id },
      data: { plan: plan as import("@prisma/client").PlanType },
    });

    await logAudit({
      userId: user.id,
      actorId,
      resource: "user",
      action: "user.plan_changed",
      resourceId: user.id,
      oldValue: { plan: oldPlan },
      newValue: { plan },
      success: true,
    });
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
