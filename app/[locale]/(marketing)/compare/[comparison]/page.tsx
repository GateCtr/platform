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
import { LLM_MODELS, FEATURED_COMPARISONS } from "@/lib/pseo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, TrendingDown } from "lucide-react";
import { appUrl } from "@/lib/app-url";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return FEATURED_COMPARISONS.map((comparison) => ({ comparison }));
}

function parseSlug(slug: string) {
  const idx = slug.indexOf("-vs-");
  if (idx === -1) return null;
  return { slugA: slug.slice(0, idx), slugB: slug.slice(idx + 4) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; comparison: string }>;
}): Promise<Metadata> {
  const { locale, comparison } = await params;
  const parsed = parseSlug(comparison);
  if (!parsed) return {};
  const modelA = LLM_MODELS.find((m) => m.slug === parsed.slugA);
  const modelB = LLM_MODELS.find((m) => m.slug === parsed.slugB);
  if (!modelA || !modelB) return {};
  const context = await getSeoContext();
  const canonical = buildCanonicalUrl(
    `/compare/${comparison}`,
    locale,
    context,
  );
  const alternates = buildAlternateUrls(`/compare/${comparison}`, context);
  const og = buildOgLocale(locale);
  return {
    title: `${modelA.name} vs ${modelB.name} — Price, Speed & Cost Comparison 2025 | GateCtr`,
    description: `${modelA.name} costs $${modelA.inputPer1M}/1M tokens. ${modelB.name} costs $${modelB.inputPer1M}/1M tokens. See which is cheaper and how GateCtr reduces both bills by up to 40%.`,
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

const VOLUMES = [1_000_000, 10_000_000, 100_000_000];
const COMPRESSION = 0.4;

function calcCost(tokens: number, inputPer1M: number, outputPer1M: number) {
  return (
    ((tokens * 0.7) / 1_000_000) * inputPer1M +
    ((tokens * 0.3) / 1_000_000) * outputPer1M
  );
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ locale: string; comparison: string }>;
}) {
  const { locale, comparison } = await params;
  const parsed = parseSlug(comparison);
  if (!parsed) notFound();

  const modelA = LLM_MODELS.find((m) => m.slug === parsed.slugA);
  const modelB = LLM_MODELS.find((m) => m.slug === parsed.slugB);
  if (!modelA || !modelB) notFound();

  const t = await getTranslations({ locale, namespace: "pseo.compare" });

  const related = FEATURED_COMPARISONS.filter(
    (s) =>
      s !== comparison &&
      (s.includes(parsed.slugA) || s.includes(parsed.slugB)),
  ).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${modelA.name} vs ${modelB.name}`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: modelA.name,
        url: `https://gatectr.com/models/${modelA.slug}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: modelB.name,
        url: `https://gatectr.com/models/${modelB.slug}`,
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
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
            <Link
              href="/compare"
              className="hover:text-foreground transition-colors"
            >
              Compare
            </Link>
            <span>/</span>
            <span className="text-foreground truncate">
              {modelA.name} vs {modelB.name}
            </span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
            <span className="text-primary">{modelA.name}</span>
            <span className="text-muted-foreground mx-3 font-normal">vs</span>
            <span className="text-secondary-500">{modelB.name}</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Price, speed, and context window comparison — 2025
          </p>
        </div>
      </section>

      <Separator />

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Side-by-side specs */}
          <Card className="overflow-hidden py-0">
            <CardHeader className="px-6 py-4 border-b border-border bg-muted/30">
              <CardTitle className="text-base">Specifications</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 w-1/3" />
                    <TableHead className="text-center font-semibold text-primary">
                      {modelA.name}
                    </TableHead>
                    <TableHead className="text-center font-semibold text-secondary-500 pr-6">
                      {modelB.name}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [
                      t("inputPrice"),
                      `$${modelA.inputPer1M.toFixed(4)}`,
                      `$${modelB.inputPer1M.toFixed(4)}`,
                    ],
                    [
                      t("outputPrice"),
                      `$${modelA.outputPer1M.toFixed(4)}`,
                      `$${modelB.outputPer1M.toFixed(4)}`,
                    ],
                    [
                      t("contextWindow"),
                      `${(modelA.contextWindow / 1000).toFixed(0)}K`,
                      `${(modelB.contextWindow / 1000).toFixed(0)}K`,
                    ],
                    [
                      t("speed"),
                      `${modelA.speedTokensPerSec} tok/s`,
                      `${modelB.speedTokensPerSec} tok/s`,
                    ],
                    ["Provider", modelA.provider, modelB.provider],
                  ].map(([label, valA, valB]) => (
                    <TableRow key={label}>
                      <TableCell className="pl-6 font-medium text-muted-foreground">
                        {label}
                      </TableCell>
                      <TableCell className="text-center tabular-nums font-semibold text-foreground">
                        {valA}
                      </TableCell>
                      <TableCell className="text-center tabular-nums font-semibold text-foreground pr-6">
                        {valB}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Cost by volume */}
          <Card className="overflow-hidden py-0">
            <CardHeader className="px-6 py-4 border-b border-border bg-muted/30">
              <CardTitle className="text-base">{t("cheaperFor")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">{t("volume")}</TableHead>
                    <TableHead className="text-right font-semibold text-primary">
                      {modelA.name}
                    </TableHead>
                    <TableHead className="text-right font-semibold text-secondary-500">
                      {modelB.name}
                    </TableHead>
                    <TableHead className="text-center pr-6 text-emerald-600 dark:text-emerald-400">
                      {t("cheaper")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {VOLUMES.map((vol) => {
                    const costA = calcCost(
                      vol,
                      modelA.inputPer1M,
                      modelA.outputPer1M,
                    );
                    const costB = calcCost(
                      vol,
                      modelB.inputPer1M,
                      modelB.outputPer1M,
                    );
                    const cheaper = costA <= costB ? modelA.name : modelB.name;
                    return (
                      <TableRow key={vol}>
                        <TableCell className="pl-6 font-medium">
                          {(vol / 1_000_000).toFixed(0)}M tokens/mo
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ${costA.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ${costB.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center pr-6">
                          <Badge
                            variant="outline"
                            className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          >
                            {cheaper}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* With GateCtr */}
          <Card className="py-0 overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <TrendingDown className="size-4 text-emerald-500" />
                <CardTitle className="text-base">{t("withGatectr")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[modelA, modelB].map((m) => {
                  const base = calcCost(
                    10_000_000,
                    m.inputPer1M,
                    m.outputPer1M,
                  );
                  const compressed = calcCost(
                    10_000_000 * (1 - COMPRESSION),
                    m.inputPer1M,
                    m.outputPer1M,
                  );
                  return (
                    <div
                      key={m.slug}
                      className="rounded-lg border border-border bg-muted/20 p-4"
                    >
                      <div className="font-semibold text-foreground mb-3">
                        {m.name}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            10M tokens/mo
                          </span>
                          <span className="line-through text-muted-foreground tabular-nums">
                            ${base.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            With GateCtr
                          </span>
                          <span className="font-semibold text-foreground tabular-nums">
                            ${compressed.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-1 mt-1">
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {t("savings")}
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            −${(base - compressed).toFixed(2)}/mo
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Related comparisons */}
          {related.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3">
                {t("relatedComparisons")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {related.map((slug) => {
                  const p = parseSlug(slug);
                  if (!p) return null;
                  const mA = LLM_MODELS.find((m) => m.slug === p.slugA);
                  const mB = LLM_MODELS.find((m) => m.slug === p.slugB);
                  if (!mA || !mB) return null;
                  return (
                    <Button key={slug} variant="outline" size="sm" asChild>
                      <Link href={`/compare/${slug}`}>
                        {mA.name} vs {mB.name}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <Card className="bg-muted/20 text-center py-10">
            <CardContent className="px-6">
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Reduce both bills by up to 40%
              </h2>
              <p className="text-muted-foreground mb-6">
                One endpoint swap. GateCtr compresses, routes, and caps —
                automatically.
              </p>
              <Button variant="cta-primary" size="lg" asChild>
                <a href={appUrl("/sign-up")}>
                  {t("ctaLabel")} <ArrowRight className="size-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
