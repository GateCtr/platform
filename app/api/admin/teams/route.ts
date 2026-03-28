import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export type TeamListItem = {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPlan: string;
  memberCount: number;
  projectCount: number;
  createdAt: Date;
};

export type TeamListPayload = {
  teams: TeamListItem[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * GET /api/admin/teams
 * Returns a paginated list of teams with owner info and counts.
 * Supports optional search across name, slug, and owner email.
 * Requires: users:read permission
 */
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await getCurrentUser();
  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canRead = await hasPermission(currentUser.id, "users:read");
  if (!canRead)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "25", 10)),
  );
  const search = searchParams.get("search")?.trim() || undefined;

  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
          {
            owner: {
              email: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      }
    : undefined;

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      skip,
      take: pageSize,
      where,
      include: {
        owner: { select: { email: true, plan: true } },
        _count: { select: { members: true, projects: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.team.count({ where }),
  ]);

  const payload: TeamListPayload = {
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      ownerEmail: t.owner.email,
      ownerPlan: t.owner.plan,
      memberCount: t._count.members,
      projectCount: t._count.projects,
      createdAt: t.createdAt,
    })),
    total,
    page,
    pageSize,
  };

  return NextResponse.json(payload);
}
