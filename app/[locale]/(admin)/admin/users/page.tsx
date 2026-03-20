import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { AdminUsersClient } from "@/components/admin/users/index";
import type { RoleName } from "@/types/globals";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminUsers.metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  const canWrite = currentUser
    ? await hasPermission(currentUser.id, "users:write")
    : false;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      clerkId: true,
      name: true,
      email: true,
      avatarUrl: true,
      plan: true,
      isActive: true,
      isBanned: true,
      bannedReason: true,
      createdAt: true,
      lastLoginAt: true,
      authProvider: true,
      userRoles: {
        select: { role: { select: { name: true, displayName: true } } },
      },
      _count: { select: { projects: true } },
      dailyUsage: {
        select: { totalTokens: true },
        orderBy: { date: "desc" },
        take: 30,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = users.map((u) => ({
    id: u.id,
    clerkId: u.clerkId,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    plan: u.plan,
    isActive: u.isActive,
    isBanned: u.isBanned,
    bannedReason: u.bannedReason,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    authProvider: u.authProvider ?? null,
    roles: u.userRoles.map((ur) => ({
      name: ur.role.name as RoleName,
      displayName: ur.role.displayName,
    })),
    tokenUsage: u.dailyUsage.reduce((s, d) => s + d.totalTokens, 0),
    projectCount: u._count.projects,
  }));

  return <AdminUsersClient users={rows} canWrite={canWrite} />;
}
