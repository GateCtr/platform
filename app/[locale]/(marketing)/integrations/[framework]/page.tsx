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
import { INTEGRATIONS, LLM_MODELS } from "@/lib/pseo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import { appUrl } from "@/lib/app-url";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return INTEGRATIONS.filter((i) => i.searchVolume === "high").map((i) => ({
    framework: i.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; framework: string }>;
}): Promise<Metadata> {
  const { locale, framework } = await params;
  const integration = INTEGRATIONS.find((i) => i.slug === framework);
  if (!integration) return {};
  const context = await getSeoContext();
  const canonical = buildCanonicalUrl(
    `/integrations/${framework}`,
    locale,
    context,
  );
  const alternates = buildAlternateUrls(`/integrations/${framework}`, context);
  const og = buildOgLocale(locale);
  return {
    title: `GateCtr + ${integration.name} — Cut LLM Costs in 2 Minutes | GateCtr`,
    description: `${integration.description}. Add budget caps, prompt compression, and cost analytics to ${integration.name} with one base URL change.`,
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

const LANG_BADGE: Record<string, string> = {
  python: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  typescript: "bg-primary/10 text-primary border-primary/20",
  rest: "bg-muted text-muted-foreground border-border",
};

const LANG_LABEL: Record<string, string> = {
  python: "Python",
  typescript: "TypeScript",
  rest: "REST",
};

export default async function IntegrationPage({
  params,
}: {
  params: Promise<{ locale: string; framework: string }>;
}) {
  const { locale, framework } = await params;
  const integration = INTEGRATIONS.find((i) => i.slug === framework);
  if (!integration) notFound();

  const t = await getTranslations({ locale, namespace: "pseo.integrations" });

  const compatibleModels = LLM_MODELS.filter((m) =>
    integration.language === "python"
      ? ["OpenAI", "Anthropic", "Mistral"].includes(m.provider)
      : ["OpenAI", "Anthropic", "Google"].includes(m.provider),
  ).slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `GateCtr + ${integration.name}`,
    description: integration.description,
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: t("step1"),
        text: `Install ${integration.name} as usual — no additional packages required.`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: t("step2"),
        text: `Change the base URL to https://api.gatectr.com/v1 in your ${integration.name} client configuration.`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: t("step3"),
        text: "Make a test API call and verify the response in the GateCtr dashboard.",
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
              href="/integrations"
              className="hover:text-foreground transition-colors"
            >
              Integrations
            </Link>
            <span>/</span>
            <span className="text-foreground">{integration.name}</span>
          </nav>
          <div className="flex items-center gap-2 mb-4">
            <Badge
              variant="outline"
              className={LANG_BADGE[integration.language]}
            >
              {LANG_LABEL[integration.language]}
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
            GateCtr + {integration.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {integration.description}
          </p>
        </div>
      </section>

      <Separator />

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Steps */}
          {[
            {
              step: 1,
              label: t("step1"),
              content: `No additional packages required. Use your existing ${integration.name} installation.`,
              code: null,
            },
            { step: 2, label: t("step2"), content: null, code: true },
            {
              step: 3,
              label: t("step3"),
              content:
                "Make a test call and check the GateCtr dashboard for token savings and cost data.",
              code: null,
            },
          ].map(({ step, label, content, code }) => (
            <div key={step} className="flex gap-4">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0 mt-0.5">
                {step}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {label}
                </h2>
                {content && (
                  <p className="text-muted-foreground mb-4">{content}</p>
                )}
                {code && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: t("before"), codeStr: integration.beforeCode },
                      { label: t("after"), codeStr: integration.afterCode },
                    ].map(({ label: codeLabel, codeStr }) => (
                      <div key={codeLabel}>
                        <div className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                          {codeLabel}
                        </div>
                        <pre className="rounded-xl border border-border bg-muted/30 p-4 text-xs overflow-x-auto whitespace-pre font-mono leading-relaxed">
                          {codeStr}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Under the hood */}
          <Card className="bg-muted/20 py-0 overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border">
              <CardTitle className="text-base">
                {t("underTheHood", { framework: integration.name })}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <p className="text-muted-foreground leading-relaxed">
                {t("underTheHoodBody", { framework: integration.name })}
              </p>
            </CardContent>
          </Card>

          {/* Compatible models */}
          {compatibleModels.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3">
                {t("compatibleModels")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {compatibleModels.map((m) => (
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
                {t("ctaLabel", { framework: integration.name })}
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
