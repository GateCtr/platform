import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AnalyticsClient } from "./_components/analytics-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "adminAnalytics.metadata",
  });
  return { title: t("title") };
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const validRange = range === "7d" || range === "90d" ? range : "30d";

  return <AnalyticsClient initialRange={validRange} />;
}
