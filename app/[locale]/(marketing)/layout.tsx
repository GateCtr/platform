import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  getSeoContext,
  buildCanonicalUrl,
  buildAlternateUrls,
  buildOgLocale,
} from "@/lib/seo";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Suspense } from "react";
import { AnnouncementBar } from "@/components/marketing/announcement-bar";
import { UTMCapture } from "@/components/marketing/utm-capture";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.marketing" });
  const context = await getSeoContext();
  const canonical = buildCanonicalUrl("/", locale, context);
  const alternates = buildAlternateUrls("/", context);
  const og = buildOgLocale(locale);

  return {
    title: { default: t("defaultTitle"), template: "%s | GateCtr" },
    description: t("defaultDescription"),
    robots: { index: true, follow: true },
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

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { marketingUrl } = await getSeoContext();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        url: marketingUrl,
        name: "GateCtr",
      },
      {
        "@type": "Organization",
        name: "GateCtr",
        url: marketingUrl,
        logo: `${marketingUrl}/logo.png`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <UTMCapture />
      </Suspense>
      <AnnouncementBar locale={locale} />
      <Header variant="marketing" />
      <main className="flex-1 flex items-center justify-center px-4 pt-8 pb-12">
        {children}
      </main>
      <Footer variant="marketing" />
    </div>
  );
}
