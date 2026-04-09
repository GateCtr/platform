import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getProspects, getTemplates, getStats } from "@/lib/actions/outreach";
import { OutreachPageClient } from "@/components/admin/outreach/outreach-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "adminOutreach.metadata",
  });
  return { title: t("title") };
}

export default async function AdminOutreachPage() {
  try {
    await requirePermission("analytics:read");
  } catch {
    redirect("/admin/overview");
  }

  const [prospects, templates, stats] = await Promise.all([
    getProspects(),
    getTemplates(),
    getStats(),
  ]);

  // Serialize: convert Date objects to ISO strings for client component props
  const serializedProspects = prospects.map((p) => ({
    ...p,
    lastContactedAt: p.lastContactedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    emailLogs: p.emailLogs.map((log) => ({
      ...log,
      openedAt: log.openedAt?.toISOString() ?? null,
      clickedAt: log.clickedAt?.toISOString() ?? null,
      scheduledAt: log.scheduledAt?.toISOString() ?? null,
      sentAt: log.sentAt?.toISOString() ?? null,
      createdAt: log.createdAt.toISOString(),
    })),
  }));

  const serializedTemplates = templates.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <OutreachPageClient
      prospects={serializedProspects}
      templates={serializedTemplates}
      stats={stats}
    />
  );
}
