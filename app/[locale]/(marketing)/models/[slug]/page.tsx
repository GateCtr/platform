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
import { LLM_MODELS, TOP_MODEL_SLUGS } from "@/lib/pseo-data";
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
import { cn } from "@/lib/utils";
import { ArrowRight, TrendingDown } from "lucide-react";
import { appUrl } from "@/lib/app-url";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return TOP_MODEL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const model = LLM_MODELS.find((m) => m.slug === slug);
  if (!model) return {};
  const context = await getSeoContext();
  const canonical = buildCanonicalUrl(`/models/${slug}`, locale, context);
  const alternates = buildAlternateUrls(`/models/${slug}`, context);
  const og = buildOgLocale(locale);
  return {
    title: `${model.name} Pricing — Cost per Token & Savings Calculator | GateCtr`,
    description: `${model.name} costs $${model.inputPer1M} per 1M input tokens. See how GateCtr reduces your ${model.name} bill by up to 40% with one endpoint swap.`,
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

const CATEGORY_BADGE: Record<string, string> = {
  frontier: "bg-primary/10 text-primary border-primary/20",
  efficient:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  reasoning: "bg-secondary-500/10 text-secondary-500 border-secondary-500/20",
  "open-source": "bg-muted text-muted-foreground border-border",
};

const VOLUMES = [1_000_000, 10_000_000, 100_000_000];
const COMPRESSION = 0.4;

function calcCost(tokens: number, inputPer1M: number, outputPer1M: number) {
  return (
    ((tokens * 0.7) / 1_000_000) * inputPer1M +
    ((tokens * 0.3) / 1_000_000) * outputPer1M
  );
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const model = LLM_MODELS.find((m) => m.slug === slug);
  if (!model) notFound();

  const t = await getTranslations({ locale, namespace: "pseo.models" });

  const similar = LLM_MODELS.filter(
    (m) =>
      m.slug !== slug &&
      (m.category === model.category || m.provider === model.provider),
  ).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${model.name} Pricing`,
    description: `Pricing and specifications for ${model.name} by ${model.provider}`,
    creator: { "@type": "Organization", name: model.provider },
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
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
            <Link
              href="/models"
              className="hover:text-foreground transition-colors"
            >
              Models
            </Link>
            <span>/</span>
            <span className="text-foreground">{model.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  {model.provider}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs", CATEGORY_BADGE[model.category])}
                >
                  {t(`categories.${model.category}` as Parameters<typeof t>[0])}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-3">
                {model.name}
              </h1>
              <p className="text-muted-foreground">
                {model.provider} · {(model.contextWindow / 1000).toFixed(0)}K
                context · {model.speedTokensPerSec} tok/s
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <div className="text-3xl font-bold text-foreground tabular-nums">
                ${model.inputPer1M.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("inputPrice")}
              </div>
              <div className="text-xl font-semibold text-foreground tabular-nums mt-1">
                ${model.outputPer1M.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("outputPrice")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Specs */}
          <Card className="overflow-hidden py-0">
            <CardHeader className="px-6 py-4 border-b border-border bg-muted/30">
              <CardTitle className="text-base">Specifications</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {[
                    [
                      t("inputPrice"),
                      `$${model.inputPer1M.toFixed(4)} / 1M tokens`,
                    ],
                    [
                      t("outputPrice"),
                      `$${model.outputPer1M.toFixed(4)} / 1M tokens`,
                    ],
                    [
                      t("contextWindow"),
                      `${(model.contextWindow / 1000).toFixed(0)}K tokens`,
                    ],
                    [
                      t("speed"),
                      `${model.speedTokensPerSec} ${t("tokensPerSec")}`,
                    ],
                    [t("category"), model.category],
                    ["Provider", model.provider],
                  ].map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell className="pl-6 font-medium text-muted-foreground w-1/2">
                        {label}
                      </TableCell>
                      <TableCell className="pr-6 font-semibold text-foreground tabular-nums">
                        {value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Savings calculator */}
          <Card className="overflow-hidden py-0">
            <CardHeader className="px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <TrendingDown className="size-4 text-emerald-500" />
                <CardTitle className="text-base">{t("savingsTitle")}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t("savingsSubtitle")}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">{t("volume")}</TableHead>
                    <TableHead className="text-right">
                      {t("withoutGatectr")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("withGatectr")}
                    </TableHead>
                    <TableHead className="text-right pr-6 text-emerald-600 dark:text-emerald-400">
                      {t("monthlySavings")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {VOLUMES.map((vol) => {
                    const without = calcCost(
                      vol,
                      model.inputPer1M,
                      model.outputPer1M,
                    );
                    const withGc = calcCost(
                      vol * (1 - COMPRESSION),
                      model.inputPer1M,
                      model.outputPer1M,
                    );
                    const savings = without - withGc;
                    return (
                      <TableRow key={vol}>
                        <TableCell className="pl-6 font-medium">
                          {(vol / 1_000_000).toFixed(0)}M tokens/mo
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          ${without.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-foreground font-medium">
                          ${withGc.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 pr-6">
                          −${savings.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Similar models */}
          {similar.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">
                {t("similarModels")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {similar.map((m) => (
                  <Card
                    key={m.slug}
                    className="py-4 hover:border-primary/40 transition-colors group"
                  >
                    <CardContent className="px-5">
                      <Link href={`/models/${m.slug}`} className="block">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                          {m.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.provider}
                        </div>
                        <div className="text-sm font-semibold text-foreground mt-2 tabular-nums">
                          ${m.inputPer1M.toFixed(3)}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            / 1M in
                          </span>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <Card className="bg-muted/20 text-center py-10">
            <CardContent className="px-6">
              <h2 className="text-2xl font-bold text-foreground mb-3">
                {t("ctaLabel", { model: model.name })}
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
