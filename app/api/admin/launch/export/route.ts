import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(): Promise<NextResponse> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ok = await hasPermission(user.id, "analytics:read");
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const launchDate = process.env.LAUNCH_DATE
    ? new Date(process.env.LAUNCH_DATE)
    : new Date("2026-04-15T00:00:00Z");

  // Fetch all users with their usage and subscription data
  const users = await prisma.user.findMany({
    where: { isActive: true, createdAt: { gte: launchDate } },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      metadata: true,
      createdAt: true,
      usageLogs: {
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      subscription: {
        select: { createdAt: true, plan: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build CSV rows
  const headers = [
    "userId",
    "email",
    "name",
    "plan",
    "ref",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "signupDate",
    "firstApiCallDate",
    "upgradeDate",
    "upgradePlan",
  ];

  const rows = users.map((u) => {
    const meta = (u.metadata ?? {}) as Record<string, unknown>;
    const utm = (meta.utm ?? {}) as Record<string, unknown>;

    return [
      u.id,
      u.email,
      u.name ?? "",
      u.plan,
      (meta.ref as string) ?? "",
      (utm.source as string) ?? "",
      (utm.medium as string) ?? "",
      (utm.campaign as string) ?? "",
      u.createdAt.toISOString(),
      u.usageLogs[0]?.createdAt.toISOString() ?? "",
      u.subscription?.createdAt.toISOString() ?? "",
      u.subscription?.plan.name !== "FREE"
        ? (u.subscription?.plan.name ?? "")
        : "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `gatectr-launch-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
