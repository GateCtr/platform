import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FeatureFlagsTable, type FeatureFlagRow } from "@/components/admin/feature-flags/feature-flags-table";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminFeatureFlags.metadata" });
  return { title: t("title") };
}

async function fetchFlags(): Promise<FeatureFlagRow[]> {
  const flags = await prisma.featureFlag.findMany({
    include: {
      _count: { select: { overrides: true } },
      overrides: {
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { key: "asc" },
  });

  return flags.map((f) => ({
    id: f.id,
    key: f.key,
    name: f.name,
    description: f.description,
    enabled: f.enabled,
    rolloutPct: f.rolloutPct,
    enabledPlans: f.enabledPlans,
    overrideCount: f._count.overrides,
    overrides: f.overrides.map((o) => ({
      id: o.id,
      userId: o.userId,
      enabled: o.enabled,
      user: o.user,
    })),
  }));
}

export default async function FeatureFlagsPage() {
  try {
    await requirePermission("system:read");
  } catch {
    redirect("/admin/overview");
  }

  const t = await getTranslations("adminFeatureFlags");
  const flags = await fetchFlags();

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
          <FeatureFlagsTable flags={flags} />
        </CardContent>
      </Card>
    </div>
  );
}
