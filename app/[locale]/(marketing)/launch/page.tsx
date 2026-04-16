import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSeoContext, buildCanonicalUrl } from "@/lib/seo";
import { WebPageJsonLd } from "@/components/seo/json-ld";
import { LaunchPage } from "@/components/marketing/launch-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "launch.metadata" });
  const context = await getSeoContext();
  const canonical = buildCanonicalUrl("/launch", locale, context);

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: canonical,
    },
    twitter: {
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
  };
}

export default async function LaunchRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "launch.metadata" });
  const context = await getSeoContext();
  const url = buildCanonicalUrl("/launch", locale, context);

  return (
    <>
      <WebPageJsonLd
        url={url}
        name={t("title")}
        description={t("description")}
      />
      <LaunchPage />
    </>
  );
}
