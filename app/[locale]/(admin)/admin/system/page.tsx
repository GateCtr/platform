import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SystemHealthClient } from "./_components/system-health-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "adminSystem.metadata",
  });
  return { title: t("title") };
}

export default function SystemHealthPage() {
  return <SystemHealthClient />;
}
