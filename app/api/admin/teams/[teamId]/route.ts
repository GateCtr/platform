import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/app/api/admin/feature-flags/[id]/route";

/**
 * GET /api/admin/teams/[teamId]
 * Returns full team detail: metadata, owner, members with roles,
 * pending invitations, and associated projects.
 * Requires: users:read permission
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;

  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await getCurrentUser();
  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canRead = await hasPermission(currentUser.id, "users:read");
  if (!canRead)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          avatarUrl: true,
        },
      },
      members: {
        include: {
          user: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      invitations: {
        where: { revokedAt: null, acceptedAt: null },
        orderBy: { createdAt: "desc" },
      },
      projects: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!team)
    return NextResponse.json({ error: "Team not found" }, { status: 404 });

  return NextResponse.json(team);
}

/**
 * DELETE /api/admin/teams/[teamId]
 * Cascade-deletes a team and all associated records.
 * Requires: users:delete permission
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;

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

  const canDelete = await hasPermission(currentUser.id, "users:delete");
  if (!canDelete)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 },
    );

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true, slug: true, ownerId: true },
  });

  if (!team)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Team not found", code: "NOT_FOUND" },
      { status: 404 },
    );

  // Cascade delete — Prisma handles related records via onDelete: Cascade
  // on TeamMember, TeamInvitation, Project, ApiKey, Webhook, LLMProviderKey
  await prisma.team.delete({ where: { id: teamId } });

  void logAudit({
    actorId: currentUser.id,
    resource: "team",
    action: "team.deleted",
    resourceId: teamId,
    oldValue: { name: team.name, slug: team.slug, ownerId: team.ownerId },
    newValue: null,
    success: true,
  });

  return NextResponse.json<ActionResult<{ id: string }>>({
    success: true,
    data: { id: teamId },
  });
}
