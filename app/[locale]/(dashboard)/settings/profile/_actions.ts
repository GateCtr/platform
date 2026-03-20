"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { validateCsrf } from "@/lib/csrf";

export async function updateProfile(formData: FormData) {
  await validateCsrf();
  const { userId } = await auth();
  if (!userId) return { error: "not_authenticated" };

  const name = formData.get("name")?.toString().trim();
  if (!name || name.length < 2) return { error: "name_too_short" };

  try {
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return { error: "user_not_found" };

    // Update DB
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { name },
    });

    // Sync name to Clerk
    const client = await clerkClient();
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || undefined;
    await client.users.updateUser(userId, { firstName, lastName });

    await logAudit({
      userId: dbUser.id,
      actorId: dbUser.id,
      resource: "user",
      action: "user.profile_updated",
      resourceId: dbUser.id,
      newValue: { name },
      success: true,
    });

    return { success: true };
  } catch (err) {
    console.error("updateProfile error:", err);
    return { error: "failed" };
  }
}

export async function deleteAccount() {
  await validateCsrf();
  const { userId } = await auth();
  if (!userId) return { error: "not_authenticated" };

  try {
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return { error: "user_not_found" };

    await logAudit({
      userId: dbUser.id,
      actorId: dbUser.id,
      resource: "user",
      action: "user.account_deleted",
      resourceId: dbUser.id,
      success: true,
    });

    // Delete from DB (cascades to all related data)
    await prisma.user.delete({ where: { id: dbUser.id } });

    // Delete from Clerk
    const client = await clerkClient();
    await client.users.deleteUser(userId);

    return { success: true };
  } catch (err) {
    console.error("deleteAccount error:", err);
    return { error: "failed" };
  }
}
