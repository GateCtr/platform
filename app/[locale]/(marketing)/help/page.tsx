"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Rocket,
  Code2,
  CreditCard,
  GitBranch,
  Shield,
  Users,
  Search,
  ArrowRight,
  MessageCircle,
  Github,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/shared/status-dot";
import { appUrl } from "@/lib/app-url";

type CategoryItem = { title: string; description: string; url: string };
type ArticleItem = { title: string; category: string; url: string };

const CATEGORY_ICONS = [Rocket, Code2, CreditCard, GitBranch, Shield, Users];

export default function HelpPage() {
  const t = useTranslations("help");
  const [search, setSearch] = useState("");

  const categories = t.raw("categories.items") as CategoryItem[];
  const articles = t.raw("popular.items") as ArticleItem[];

  const filteredArticles = search.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.category.toLowerCase().includes(search.toLowerCase()),
      )
    : articles;

  return (
    <main className="w-full">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-mono text-muted-foreground mb-6 backdrop-blur-sm">
            <HelpCircle className="size-3 text-secondary-500" aria-hidden />
            {t("hero.badge")}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5 leading-tight">
            {t("hero.headline")}
          </h1>

          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {t("hero.subtext")}
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("hero.searchPlaceholder")}
              className="w-full border border-border bg-card rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
      </section>

      {/* ── Categories grid ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-mono text-secondary-500 uppercase tracking-widest mb-3">
              {t("categories.label")}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("categories.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((item, i) => {
              const Icon = CATEGORY_ICONS[i];
              return (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight
                    className="size-3.5 text-muted-foreground absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden
                  />
                  <div className="absolute bottom-0 left-5 right-5 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Popular articles ─────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-mono text-secondary-500 uppercase tracking-widest mb-3">
              {t("popular.label")}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("popular.title")}
            </h2>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {filteredArticles.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">
                {t("popular.noResults")}
              </p>
            ) : (
              filteredArticles.map((article, i) => (
                <a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-foreground font-medium truncate">
                      {article.title}
                    </span>
                    <span className="shrink-0 inline-block rounded-full bg-primary/8 text-primary text-xs font-medium px-2.5 py-0.5">
                      {article.category}
                    </span>
                  </div>
                  <ArrowRight
                    className="size-4 text-muted-foreground shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden
                  />
                </a>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Still need help? ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-mono text-secondary-500 uppercase tracking-widest mb-3">
              {t("contact.label")}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("contact.title")}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/8 text-primary">
                <MessageCircle className="size-5" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  {t("contact.support.title")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("contact.support.description")}
                </p>
              </div>
              <Button variant="cta-secondary" size="sm" asChild>
                <a href="mailto:support@gatectr.com">
                  {t("contact.support.cta")}
                  <ArrowRight className="size-3.5" />
                </a>
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary-500/10 text-secondary-500">
                <Github className="size-5" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  {t("contact.community.title")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("contact.community.description")}
                </p>
              </div>
              <Button variant="cta-secondary" size="sm" asChild>
                <a
                  href="https://github.com/GateCtr/gatectr/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("contact.community.cta")}
                  <ArrowRight className="size-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("cta.headline")}
          </h2>
          <p className="text-muted-foreground mb-8">{t("cta.description")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Button variant="cta-primary" size="lg" asChild>
              <a href={appUrl("/sign-up")}>
                {t("cta.primary")}
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button variant="cta-secondary" size="lg" asChild>
              <a
                href="https://docs.gatectr.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("cta.secondary")}
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/60">{t("cta.trust")}</p>
        </div>
      </section>

      {/* ── Status strip ─────────────────────────────────────────────────── */}
      <div className="bg-muted/40 border-t border-border py-3 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("status.label")}:</span>
            <StatusDot label={t("status.operational")} />
          </div>
          <a
            href={
              process.env.NEXT_PUBLIC_STATUS_URL ?? "https://status.gatectr.com"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {t("status.viewStatus")}
            <ArrowRight className="size-3" aria-hidden />
          </a>
        </div>
      </div>
    </main>
  );
}
