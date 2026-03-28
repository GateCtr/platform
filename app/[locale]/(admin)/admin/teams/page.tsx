import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TeamsTable, type TeamRow } from "@/components/admin/teams/teams-table";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminTeams.metadata" });
  return { title: t("title") };
}

async function fetchTeams(search?: string, page = 1, pageSize = 25): Promise<{ teams: TeamRow[]; total: number }> {
  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
          { owner: { email: { contains: search, mode: "insensitive" as const } } },
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

  return {
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      ownerEmail: t.owner.email,
      ownerPlan: t.owner.plan,
      memberCount: t._count.members,
      projectCount: t._count.projects,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
  };
}

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  try {
    await requirePermission("users:read");
  } catch {
    redirect("/admin/overview");
  }

  const { search, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const { teams, total } = await fetchTeams(search, page);

  const t = await getTranslations("adminTeams");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TeamsTable teams={teams} total={total} page={page} pageSize={25} />
        </CardContent>
      </Card>
    </div>
  );
}
