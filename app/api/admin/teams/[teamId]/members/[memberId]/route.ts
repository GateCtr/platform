import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/app/api/admin/feature-flags/[id]/route";

/**
 * DELETE /api/admin/teams/[teamId]/members/[memberId]
 * Removes a member from a team.
 * Requires: users:write permission
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string; memberId: string }> },
) {
  const { teamId, memberId } = await params;

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

  const canWrite = await hasPermission(currentUser.id, "users:write");
  if (!canWrite)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 },
    );

  const member = await prisma.teamMember.findUnique({
    where: { id: memberId },
    include: {
      user: { select: { id: true, email: true } },
      team: { select: { id: true, name: true } },
    },
  });

  if (!member || member.teamId !== teamId)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Member not found", code: "NOT_FOUND" },
      { status: 404 },
    );

  await prisma.teamMember.delete({ where: { id: memberId } });

  void logAudit({
    actorId: currentUser.id,
    resource: "team_member",
    action: "team.member_removed",
    resourceId: memberId,
    oldValue: {
      teamId,
      teamName: member.team.name,
      userId: member.user.id,
      userEmail: member.user.email,
      role: member.role,
    },
    newValue: null,
    success: true,
  });

  return NextResponse.json<ActionResult<{ id: string }>>({
    success: true,
    data: { id: memberId },
  });
}
