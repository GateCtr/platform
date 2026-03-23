import { prisma } from "@/lib/prisma";

export interface TeamContext {
  userId: string;
  teamId: string;
}

/**
 * Resolves the active teamId for a given DB user.
 * Priority: user.metadata.activeTeamId → first TeamMember by createdAt
 */
export async function resolveTeamContext(
  clerkId: string,
): Promise<TeamContext | null> {
  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, metadata: true },
  });
  if (!dbUser) return null;

  const meta = (dbUser.metadata ?? {}) as Record<string, unknown>;
  let teamId = meta.activeTeamId as string | undefined;

  if (!teamId) {
    const membership = await prisma.teamMember.findFirst({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "asc" },
      select: { teamId: true },
    });
    teamId = membership?.teamId;
  }

  if (!teamId) return null;

  return { userId: dbUser.id, teamId };
}
