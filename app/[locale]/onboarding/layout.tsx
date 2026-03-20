import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Zap, ShieldCheck, GitBranch, Lock } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboarding.metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

const FEATURE_ICONS = [Zap, ShieldCheck, GitBranch, Lock] as const;
const FEATURE_KEYS = ["optimizer", "firewall", "router", "security"] as const;

export default async function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { sessionClaims } = await auth();

  if (
    (sessionClaims?.publicMetadata as { onboardingComplete?: boolean } | undefined)
      ?.onboardingComplete === true
  ) {
    redirect("/dashboard");
  }

  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboarding.panel" });

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding (lg+) ── */}
      <div className="hidden lg:flex lg:w-[400px] xl:w-[460px] shrink-0 flex-col bg-primary text-primary-foreground relative overflow-hidden">
        {/* Subtle radial glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,hsl(var(--primary-400)/0.25),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,hsl(var(--secondary-500)/0.12),transparent)]" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <Logo variant="full" className="**:fill-primary-foreground **:text-primary-foreground" />

          {/* Main copy */}
          <div className="flex-1 flex flex-col justify-center gap-10">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary-foreground/40">
                {t("eyebrow")}
              </p>
              <h2 className="text-[2rem] font-bold leading-[1.15] tracking-tight whitespace-pre-line">
                {t("headline")}
              </h2>
              <p className="text-sm text-primary-foreground/60 leading-relaxed whitespace-pre-line">
                {t("tagline")}
              </p>
            </div>

            {/* Feature list */}
            <ul className="space-y-5">
              {FEATURE_KEYS.map((key, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <li key={key} className="flex items-start gap-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10 mt-0.5">
                      <Icon className="h-4 w-4 text-primary-foreground/80" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary-foreground leading-none mb-1">
                        {t(`features.${key}.label`)}
                      </p>
                      <p className="text-xs text-primary-foreground/55 leading-snug">
                        {t(`features.${key}.sub`)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-primary-foreground/30">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col min-h-screen bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-border shrink-0">
          <div className="lg:hidden">
            <Logo variant="full" />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 flex items-start justify-center px-6 py-10 overflow-y-auto">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
