import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  getSeoContext,
  buildCanonicalUrl,
  buildAlternateUrls,
  buildOgLocale,
} from "@/lib/seo";
import { GLOSSARY_TERMS, LLM_MODELS } from "@/lib/pseo-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import { appUrl } from "@/lib/app-url";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return GLOSSARY_TERMS.map((t) => ({ term: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; term: string }>;
}): Promise<Metadata> {
  const { locale, term } = await params;
  const entry = GLOSSARY_TERMS.find((t) => t.slug === term);
  if (!entry) return {};
  const context = await getSeoContext();
  const canonical = buildCanonicalUrl(`/learn/${term}`, locale, context);
  const alternates = buildAlternateUrls(`/learn/${term}`, context);
  const og = buildOgLocale(locale);
  return {
    title: `What is ${entry.name}? — LLM Cost Glossary | GateCtr`,
    description: `${entry.shortDefinition} Learn how GateCtr uses this to reduce your LLM costs.`,
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

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ locale: string; term: string }>;
}) {
  const { locale, term } = await params;
  const entry = GLOSSARY_TERMS.find((t) => t.slug === term);
  if (!entry) notFound();

  const t = await getTranslations({ locale, namespace: "pseo.learn" });

  const relatedTerms = GLOSSARY_TERMS.filter((gt) =>
    entry.relatedTerms.includes(gt.slug),
  );
  const relatedModels = LLM_MODELS.filter((m) =>
    entry.relatedModels.includes(m.slug),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTerm",
        name: entry.name,
        description: entry.shortDefinition,
        inDefinedTermSet: "https://gatectr.com/learn",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Learn",
            item: "https://gatectr.com/learn",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: entry.name,
            item: `https://gatectr.com/learn/${entry.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-12 px-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
            <Link
              href="/learn"
              className="hover:text-foreground transition-colors"
            >
              {t("allTerms")}
            </Link>
            <span>/</span>
            <span className="text-foreground">{entry.name}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
            What is {entry.name}?
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {entry.shortDefinition}
          </p>
        </div>
      </section>

      <Separator />

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Body */}
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed [&_p]:mb-4 [&_p]:text-muted-foreground [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-foreground"
            dangerouslySetInnerHTML={{ __html: entry.body }}
          />

          {/* How GateCtr handles this */}
          <Card className="bg-muted/20 py-0 overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border">
              <CardTitle className="text-base">
                {t("howGatectrHandles", { term: entry.name })}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <p className="text-muted-foreground leading-relaxed">
                GateCtr addresses {entry.name.toLowerCase()} automatically on
                every API call — no configuration required. The results are
                visible in real-time in the GateCtr dashboard, with per-request
                breakdowns of tokens, cost, and savings.
              </p>
            </CardContent>
          </Card>

          {/* Related terms */}
          {relatedTerms.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3">
                {t("relatedTerms")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {relatedTerms.map((rt) => (
                  <Button key={rt.slug} variant="outline" size="sm" asChild>
                    <Link href={`/learn/${rt.slug}`}>{rt.name}</Link>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Related models */}
          {relatedModels.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3">
                {t("relatedModels")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {relatedModels.map((m) => (
                  <Button key={m.slug} variant="outline" size="sm" asChild>
                    <Link href={`/models/${m.slug}`}>{m.name}</Link>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <Card className="bg-muted/20 text-center py-10">
            <CardContent className="px-6">
              <h2 className="text-2xl font-bold text-foreground mb-3">
                {t("ctaLabel")}
              </h2>
              <p className="text-muted-foreground mb-6">
                No credit card required. Up and running in 5 minutes.
              </p>
              <Button variant="cta-primary" size="lg" asChild>
                <a href={appUrl("/sign-up")}>
                  Start free <ArrowRight className="size-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
