import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  getSeoContext,
  buildCanonicalUrl,
  buildAlternateUrls,
  buildOgLocale,
} from "@/lib/seo";
import { GLOSSARY_TERMS } from "@/lib/pseo-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Zap } from "lucide-react";
import { appUrl } from "@/lib/app-url";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pseo.learn" });
  const context = await getSeoContext();
  const canonical = buildCanonicalUrl("/learn", locale, context);
  const alternates = buildAlternateUrls("/learn", context);
  const og = buildOgLocale(locale);
  return {
    title: t("hubTitle"),
    description: t("hubDescription"),
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

export default async function LearnHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pseo.learn" });

  const sorted = [...GLOSSARY_TERMS].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: t("h1"),
    hasDefinedTerm: sorted.map((term) => ({
      "@type": "DefinedTerm",
      name: term.name,
      description: term.shortDefinition,
      url: `https://gatectr.com/learn/${term.slug}`,
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-mono text-muted-foreground mb-6 backdrop-blur-sm">
            <Zap
              className="size-3 text-secondary-500 fill-secondary-500"
              aria-hidden
            />
            LLM Glossary
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5 leading-tight">
            {t("h1")}
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
          <Button variant="cta-primary" size="lg" asChild>
            <a href={appUrl("/sign-up")}>
              {t("ctaLabel")} <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </section>

      <Separator />

      {/* Terms grid */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map((term) => (
              <Card
                key={term.slug}
                className="py-0 hover:border-primary/40 transition-colors group"
              >
                <CardContent className="px-5 py-4 flex flex-col gap-2 h-full">
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {term.name}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1 line-clamp-2">
                    {term.shortDefinition}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit px-0 text-xs gap-1 text-primary hover:text-primary/80"
                    asChild
                  >
                    <Link href={`/learn/${term.slug}`}>
                      {t("readMore")} <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
