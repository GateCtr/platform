"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { interpolate } from "@/lib/interpolate";
import { PLAN_VARS, PLAN_PRICES } from "@/lib/plan-vars";

type Plan = {
  name: string;
  price: string;
  description: string;
  features: string[];
};

const CTA_KEYS = ["ctaFree", "ctaPro", "ctaTeam", "ctaEnterprise"] as const;
const POPULAR_INDEX = 1; // Pro
const ANNUAL_DISCOUNT = 0.83; // ~17% off = 2 months free

export function Pricing() {
  const t = useTranslations("home.pricing");
  const locale = useLocale() as "en" | "fr";
  const [annual, setAnnual] = useState(false);
  const rawPlans = t.raw("plans") as Plan[];

  const plans = rawPlans.map((plan, i) => {
    const basePrice = PLAN_PRICES[plan.name]?.[locale] ?? plan.price;
    // Apply annual discount to numeric prices (Free and Enterprise stay as-is)
    const displayPrice =
      annual && plan.name !== "Free" && plan.name !== "Enterprise"
        ? basePrice.replace(/[\d.]+/, (n) =>
            Math.round(parseFloat(n) * ANNUAL_DISCOUNT).toString(),
          )
        : basePrice;
    return {
      ...plan,
      price: displayPrice,
      features: plan.features.map((f) =>
        interpolate(f, PLAN_VARS[i] as Record<string, string | number>),
      ),
    };
  });

  return (
    <section id="pricing" className="py-20 px-4 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-mono text-secondary-500 uppercase tracking-widest mb-3">
            {t("label")}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("headline")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            {t("description")}
          </p>

          {/* Annual / Monthly toggle */}
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "text-sm font-medium transition-colors",
                !annual ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t("annualToggle")}
            </button>
            <button
              onClick={() => setAnnual((v) => !v)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                annual ? "bg-primary" : "bg-muted",
              )}
              role="switch"
              aria-checked={annual}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                  annual ? "translate-x-4" : "translate-x-0",
                )}
              />
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "text-sm font-medium transition-colors flex items-center gap-1.5",
                annual ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t("annualToggleActive")}
              {annual && (
                <span className="text-[10px] font-semibold bg-secondary-500/10 text-secondary-500 px-1.5 py-0.5 rounded-full">
                  {t("annualBadge")}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {plans.map((plan, i) => {
            const isPopular = i === POPULAR_INDEX;
            const isEnterprise = i === plans.length - 1;
            const ctaKey = CTA_KEYS[i];

            return (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-xl border bg-card p-6 flex flex-col gap-5",
                  isPopular
                    ? "border-primary shadow-md shadow-primary/10 ring-1 ring-primary/20"
                    : "border-border",
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {t("popular")}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-extrabold text-foreground">
                      {plan.price}
                    </span>
                    {!isEnterprise && (
                      <span className="text-sm text-muted-foreground">
                        {annual ? t("perYear") : t("perMonth")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="size-4 text-secondary-500 mt-0.5 shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={isPopular ? "cta-primary" : "cta-secondary"}
                  size="default"
                  className="w-full h-auto min-h-9 whitespace-normal text-center py-2"
                  asChild
                >
                  <Link href={isEnterprise ? "/contact" : "/sign-up"}>
                    {t(ctaKey)}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* ROI anchor */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          {t("roiAnchor")}
        </p>
      </div>
    </section>
  );
}
