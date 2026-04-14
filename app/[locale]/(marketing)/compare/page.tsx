import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  getSeoContext,
  buildCanonicalUrl,
  buildAlternateUrls,
  buildOgLocale,
} from "@/lib/seo";
import { LLM_MODELS, FEATURED_COMPARISONS } from "@/lib/pseo-data";
import { Badge } from "@/components/ui/badge";
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
  const t = await getTranslations({ locale, namespace: "pseo.compare" });
  const context = await getSeoContext();
  const canonical = buildCanonicalUrl("/compare", locale, context);
  const alternates = buildAlternateUrls("/compare", context);
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

function parseComparison(slug: string) {
  const idx = slug.indexOf("-vs-");
  if (idx === -1) return null;
  return { slugA: slug.slice(0, idx), slugB: slug.slice(idx + 4) };
}

export default async function CompareHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pseo.compare" });

  const comparisons = FEATURED_COMPARISONS.map((slug) => {
    const parsed = parseComparison(slug);
    if (!parsed) return null;
    const modelA = LLM_MODELS.find((m) => m.slug === parsed.slugA);
    const modelB = LLM_MODELS.find((m) => m.slug === parsed.slugB);
    if (!modelA || !modelB) return null;
    return { slug, modelA, modelB };
  }).filter(Boolean) as {
    slug: string;
    modelA: (typeof LLM_MODELS)[0];
    modelB: (typeof LLM_MODELS)[0];
  }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("h1"),
    numberOfItems: comparisons.length,
    itemListElement: comparisons.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${c.modelA.name} vs ${c.modelB.name}`,
      url: `https://gatectr.com/compare/${c.slug}`,
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
            Model Comparisons
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5 leading-tight">
            {t("h1")}
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
          <Button variant="cta-primary" size="lg" asChild>
            <a href={appUrl("/sign-up")}>
              Start saving — free <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </section>

      <Separator />

      {/* Comparisons grid */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono text-secondary-500 uppercase tracking-widest mb-6">
            {t("featuredLabel")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {comparisons.map(({ slug, modelA, modelB }) => (
              <Card
                key={slug}
                className="py-0 hover:border-primary/40 transition-colors group"
              >
                <CardContent className="px-5 py-4">
                  <Link
                    href={`/compare/${slug}`}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2 leading-snug">
                        {modelA.name}{" "}
                        <span className="text-muted-foreground font-normal text-sm">
                          {t("vsLabel")}
                        </span>{" "}
                        {modelB.name}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {modelA.provider}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {modelB.provider}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 tabular-nums">
                        ${modelA.inputPer1M.toFixed(3)} vs $
                        {modelB.inputPer1M.toFixed(3)} / 1M in
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
