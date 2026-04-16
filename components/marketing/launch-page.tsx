"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Shield,
  Zap,
  GitBranch,
  BarChart3,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { appUrl } from "@/lib/app-url";

const ICON_MAP = {
  shield: Shield,
  zap: Zap,
  "git-branch": GitBranch,
  "bar-chart-3": BarChart3,
} as const;

const PROMO_CODE = "PRODUCTHUNT26";

const BEFORE_CODE = `client = OpenAI(
  api_key="sk-..."
)`;

const AFTER_CODE = `client = OpenAI(
  api_key="gct-...",
  base_url="https://api.gatectr.com/v1"
)`;

const PROVIDERS = ["OpenAI", "Anthropic", "Mistral", "Gemini"];

export function LaunchPage() {
  const t = useTranslations("launch");
  const [copied, setCopied] = useState(false);

  const features = t.raw("features.items") as {
    icon: string;
    title: string;
    description: string;
  }[];
  const stats = t.raw("stats.items") as { value: string; label: string }[];

  function copyCode() {
    navigator.clipboard.writeText(PROMO_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="w-full">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/40 px-4 py-1.5 text-sm font-semibold text-orange-700 dark:text-orange-400 mb-6">
            {t("hero.badge")}
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
            {t("hero.headline")}
            <br />
            <span className="text-primary">{t("hero.headlineSub")}</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            {t("hero.description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button size="lg" asChild className="h-12 px-8 text-base font-bold">
              <Link href={appUrl("/sign-up?ref=producthunt")}>
                {t("hero.ctaPrimary")}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 px-6 text-base gap-2"
            >
              <a
                href={t("hero.productHuntUrl")}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("hero.ctaSecondary")}
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {t("hero.social")}
          </p>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Exclusive offer ──────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              {t("offer.badge")}
            </span>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">
              {t("offer.headline")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("offer.description")}
            </p>

            <div className="flex items-center justify-center gap-3">
              <div className="rounded-xl border-2 border-dashed border-primary bg-background px-6 py-3">
                <span className="font-mono text-2xl font-bold tracking-widest text-primary">
                  {PROMO_CODE}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                className="gap-2 h-12"
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-green-500" />
                    {t("offer.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    {t("offer.copy")}
                  </>
                )}
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              {t("offer.note")}
            </p>
          </div>
        </div>
      </section>

      {/* ── Integration code ─────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block rounded-full border border-border bg-background px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-4">
              {t("integration.badge")}
            </span>
            <h2 className="text-3xl font-extrabold text-foreground mb-3">
              {t("integration.headline")}
            </h2>
            <p className="text-muted-foreground">
              {t("integration.description")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 items-stretch">
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">
                {t("integration.before")}
              </p>
              <pre className="font-mono text-sm text-foreground whitespace-pre overflow-x-auto">
                {BEFORE_CODE}
              </pre>
            </div>

            <div className="rounded-xl border border-primary/40 bg-primary/5 p-5 relative">
              <span className="absolute -top-3 left-4 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                ✓ {t("integration.after")}
              </span>
              <pre className="font-mono text-sm text-foreground whitespace-pre overflow-x-auto mt-1">
                {AFTER_CODE}
              </pre>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              {t("integration.compatible")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {PROVIDERS.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-border bg-background px-3 py-1 text-sm font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">
            {t("features.headline")}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => {
              const Icon = ICON_MAP[f.icon as keyof typeof ICON_MAP] ?? Shield;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-6 flex gap-4"
                >
                  <div className="shrink-0 size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Maker note ───────────────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-muted/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-4">{t("makerNote.headline")}</h2>
          <blockquote className="text-muted-foreground italic leading-relaxed border-l-4 border-primary pl-6 text-left">
            {t("makerNote.body")}
          </blockquote>
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            {t("makerNote.signature")}
          </p>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-3">{t("cta.headline")}</h2>
          <p className="text-muted-foreground mb-8">{t("cta.description")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="h-12 px-8 text-base font-bold">
              <Link href={appUrl("/sign-up?ref=producthunt")}>
                {t("cta.button")}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 px-6 gap-2"
            >
              <a
                href={t("hero.productHuntUrl")}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("cta.phButton")}
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
