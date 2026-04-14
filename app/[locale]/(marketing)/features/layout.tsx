import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  getSeoContext,
  buildCanonicalUrl,
  buildAlternateUrls,
  buildOgLocale,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "features.meta" });
  const context = await getSeoContext();
  const canonical = buildCanonicalUrl("/features", locale, context);
  const alternates = buildAlternateUrls("/features", context);
  const og = buildOgLocale(locale);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical,
      languages: {
        en: alternates.en,
        fr: alternates.fr,
        "x-default": alternates.xDefault,
      },
    },
    openGraph: {
      type: "website",
      siteName: "GateCtr",
      locale: og.locale,
      alternateLocale: og.alternateLocale,
      url: canonical,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@gatectr",
      images: ["/opengraph-image"],
    },
  };
}

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
