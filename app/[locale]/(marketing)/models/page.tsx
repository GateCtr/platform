import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  getSeoContext,
  buildCanonicalUrl,
  buildAlternateUrls,
  buildOgLocale,
} from "@/lib/seo";
import { LLM_MODELS } from "@/lib/pseo-data";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ArrowRight, Zap } from "lucide-react";
import { appUrl } from "@/lib/app-url";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pseo.models" });
  const context = await getSeoContext();
  const canonical = buildCanonicalUrl("/models", locale, context);
  const alternates = buildAlternateUrls("/models", context);
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

const CATEGORY_BADGE: Record<string, string> = {
  frontier: "bg-primary/10 text-primary border-primary/20",
  efficient:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  reasoning: "bg-secondary-500/10 text-secondary-500 border-secondary-500/20",
  "open-source": "bg-muted text-muted-foreground border-border",
};

const PROVIDERS = ["OpenAI", "Anthropic", "Google", "Mistral", "Meta"];

export default async function ModelsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pseo.models" });

  const byProvider = PROVIDERS.reduce<Record<string, typeof LLM_MODELS>>(
    (acc, p) => {
      acc[p] = LLM_MODELS.filter((m) => m.provider === p).sort(
        (a, b) => a.inputPer1M - b.inputPer1M,
      );
      return acc;
    },
    {},
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("h1"),
    numberOfItems: LLM_MODELS.length,
    itemListElement: LLM_MODELS.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.name,
      url: `https://gatectr.com/models/${m.slug}`,
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
            LLM Pricing Directory
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5 leading-tight">
            {t("h1")}
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="cta-primary" size="lg" asChild>
              <a href={appUrl("/sign-up")}>
                {t("ctaStartSaving")} <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button variant="cta-secondary" size="lg" asChild>
              <Link href="/compare">{t("ctaCompare")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* Tables by provider */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          {PROVIDERS.map((provider) => {
            const models = byProvider[provider];
            if (!models?.length) return null;
            return (
              <Card key={provider} className="overflow-hidden py-0">
                <CardHeader className="px-6 py-4 border-b border-border bg-muted/30">
                  <CardTitle className="text-base">{provider}</CardTitle>
                  <CardDescription>
                    {models.length > 1
                      ? t("modelCountPlural", { count: models.length })
                      : t("modelCount", { count: models.length })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">{t("model")}</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">
                          {t("inputPrice")}
                        </TableHead>
                        <TableHead className="text-right hidden sm:table-cell">
                          {t("outputPrice")}
                        </TableHead>
                        <TableHead className="text-right hidden md:table-cell">
                          {t("contextWindow")}
                        </TableHead>
                        <TableHead className="text-right hidden lg:table-cell">
                          {t("speed")}
                        </TableHead>
                        <TableHead className="text-center hidden lg:table-cell">
                          {t("category")}
                        </TableHead>
                        <TableHead className="pr-6 w-24" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {models.map((m) => (
                        <TableRow key={m.slug}>
                          <TableCell className="pl-6 font-medium">
                            <div>
                              <Link
                                href={`/models/${m.slug}`}
                                className="hover:text-primary transition-colors font-semibold"
                              >
                                {m.name}
                              </Link>
                              {/* Mobile: show price inline */}
                              <div className="sm:hidden text-xs text-muted-foreground mt-0.5">
                                ${m.inputPer1M.toFixed(3)} in · $
                                {m.outputPer1M.toFixed(2)} out
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                            ${m.inputPer1M.toFixed(3)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                            ${m.outputPer1M.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground hidden md:table-cell">
                            {(m.contextWindow / 1000).toFixed(0)}K
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground hidden lg:table-cell">
                            {m.speedTokensPerSec} {t("tokensPerSec")}
                          </TableCell>
                          <TableCell className="text-center hidden lg:table-cell">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                CATEGORY_BADGE[m.category],
                              )}
                            >
                              {t(
                                `categories.${m.category}` as Parameters<
                                  typeof t
                                >[0],
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-xs gap-1"
                            >
                              <Link href={`/models/${m.slug}`}>
                                {t("details")} <ArrowRight className="size-3" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {t("hubCtaTitle")}
          </h2>
          <p className="text-muted-foreground mb-8">{t("hubCtaSubtitle")}</p>
          <Button variant="cta-primary" size="lg" asChild>
            <a href={appUrl("/sign-up")}>
              {t("ctaNoCard")} <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
