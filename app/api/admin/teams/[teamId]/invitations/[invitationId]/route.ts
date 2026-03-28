import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/app/api/admin/feature-flags/[id]/route";

/**
 * DELETE /api/admin/teams/[teamId]/invitations/[invitationId]
 * Revokes a pending team invitation by setting revokedAt.
 * Requires: users:write permission
 */
export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ teamId: string; invitationId: string }> },
) {
  const { teamId, invitationId } = await params;

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

  const invitation = await prisma.teamInvitation.findUnique({
    where: { id: invitationId },
    include: { team: { select: { id: true, name: true } } },
  });

  if (!invitation || invitation.teamId !== teamId)
    return NextResponse.json<ActionResult<never>>(
      { success: false, error: "Invitation not found", code: "NOT_FOUND" },
      { status: 404 },
    );

  if (invitation.revokedAt)
    return NextResponse.json<ActionResult<never>>(
      {
        success: false,
        error: "Invitation already revoked",
        code: "VALIDATION",
      },
      { status: 422 },
    );

  const revoked = await prisma.teamInvitation.update({
    where: { id: invitationId },
    data: { revokedAt: new Date() },
  });

  void logAudit({
    actorId: currentUser.id,
    resource: "team_invitation",
    action: "team.invitation_revoked",
    resourceId: invitationId,
    oldValue: {
      teamId,
      teamName: invitation.team.name,
      email: invitation.email,
      role: invitation.role,
    },
    newValue: { revokedAt: revoked.revokedAt?.toISOString() ?? null },
    success: true,
  });

  return NextResponse.json<ActionResult<{ id: string }>>({
    success: true,
    data: { id: invitationId },
  });
}
