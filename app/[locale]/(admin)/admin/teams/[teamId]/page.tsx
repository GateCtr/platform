import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { TeamMetaCard } from "@/components/admin/teams/team-meta-card";
import { TeamMembersTable } from "@/components/admin/teams/team-members-table";
import { TeamInvitationsTable } from "@/components/admin/teams/team-invitations-table";
import { TeamProjectsList } from "@/components/admin/teams/team-projects-list";
import { DeleteTeamButton } from "@/components/admin/teams/delete-team-button";
import { Link } from "@/i18n/routing";
import { ChevronLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; teamId: string }>;
}): Promise<Metadata> {
  const { locale, teamId } = await params;
  const t = await getTranslations({ locale, namespace: "adminTeams" });
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });
  return { title: team ? `${team.name} — ${t("detail.title")}` : t("detail.title") };
}

async function fetchTeamDetail(teamId: string) {
  const [team, currentUser] = await Promise.all([
    prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: { id: true, email: true, name: true, plan: true, avatarUrl: true },
        },
        members: {
          include: {
            user: { select: { id: true, email: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        invitations: {
          where: { revokedAt: null, acceptedAt: null },
          orderBy: { createdAt: "desc" },
        },
        projects: {
          select: { id: true, name: true, slug: true, isActive: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getCurrentUser(),
  ]);

  return { team, currentUser };
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  try {
    await requirePermission("users:read");
  } catch {
    redirect("/admin/overview");
  }

  const { teamId } = await params;
  const { team, currentUser } = await fetchTeamDetail(teamId);

  if (!team) notFound();

  const canWrite = currentUser
    ? await hasPermission(currentUser.id, "users:write")
    : false;
  const canDelete = currentUser
    ? await hasPermission(currentUser.id, "users:delete")
    : false;

  const t = await getTranslations("adminTeams");

  const membersData = team.members.map((m) => ({
    id: m.id,
    role: m.role,
    createdAt: m.createdAt.toISOString(),
    user: m.user,
  }));

  const invitationsData = team.invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    expiresAt: inv.expiresAt?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
  }));

  const projectsData = team.projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back link */}
      <div>
        <Link
          href="/admin/teams"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          {t("title")}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{team.name}</h1>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">{team.slug}</p>
        </div>
        {canDelete && (
          <DeleteTeamButton teamId={team.id} teamName={team.name} />
        )}
      </div>

      {/* Meta card */}
      <TeamMetaCard
        owner={team.owner}
        createdAt={team.createdAt.toISOString()}
        slug={team.slug}
      />

      {/* Members */}
      <TeamMembersTable
        teamId={team.id}
        members={membersData}
        canWrite={canWrite}
      />

      {/* Invitations */}
      <TeamInvitationsTable
        teamId={team.id}
        invitations={invitationsData}
        canWrite={canWrite}
      />

      {/* Projects */}
      <TeamProjectsList projects={projectsData} />
    </div>
  );
}
