import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  getSeoContext,
  buildCanonicalUrl,
  buildAlternateUrls,
  buildOgLocale,
} from "@/lib/seo";
import { INTEGRATIONS } from "@/lib/pseo-data";
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
  const t = await getTranslations({ locale, namespace: "pseo.integrations" });
  const context = await getSeoContext();
  const canonical = buildCanonicalUrl("/integrations", locale, context);
  const alternates = buildAlternateUrls("/integrations", context);
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

const LANG_ORDER = ["python", "typescript", "rest"] as const;

const LANG_BADGE: Record<string, string> = {
  python: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  typescript: "bg-primary/10 text-primary border-primary/20",
  rest: "bg-muted text-muted-foreground border-border",
};

export default async function IntegrationsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pseo.integrations" });

  const byLang = INTEGRATIONS.reduce<Record<string, typeof INTEGRATIONS>>(
    (acc, i) => {
      (acc[i.language] ??= []).push(i);
      return acc;
    },
    {},
  );

  return (
    <main>
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
            Integrations
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

      {/* Integrations by language */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          {LANG_ORDER.map((lang) => {
            const items = byLang[lang];
            if (!items?.length) return null;
            const label = t(lang as Parameters<typeof t>[0]);
            return (
              <div key={lang}>
                <div className="flex items-center gap-3 mb-5">
                  <Badge variant="outline" className={LANG_BADGE[lang]}>
                    {label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {items.length} integration{items.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((integration) => (
                    <Card
                      key={integration.slug}
                      className="py-0 hover:border-primary/40 transition-colors group"
                    >
                      <CardContent className="px-5 py-4 flex flex-col gap-2 h-full">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {integration.name}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                          {integration.description}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-fit px-0 text-xs gap-1 text-primary hover:text-primary/80"
                          asChild
                        >
                          <Link href={`/integrations/${integration.slug}`}>
                            View guide <ArrowRight className="size-3" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
