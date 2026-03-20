"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight, Check, Loader2, Copy, CheckCheck,
  Shield, Zap, GitBranch, Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/shared/logo";
import { RequiredFormLabel } from "@/components/shared/required-form-label";

// ─── Success state ─────────────────────────────────────────────────────────────

function SuccessCard({
  position,
  referralCode,
}: {
  position: number | null;
  referralCode: string | null;
}) {
  const t = useTranslations("waitlist");
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const referralUrl = referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/waitlist?ref=${referralCode}`
    : null;

  const copyReferral = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader className="pb-4">
        <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2">
          <Check className="w-8 h-8 text-secondary" />
        </div>
        <CardTitle className="text-2xl">{t("success.title")}</CardTitle>
        <CardDescription className="text-base">
          {t("success.message", { position: position ?? 0 })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {position && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
            <span className="text-sm text-muted-foreground">Position</span>
            <span className="text-lg font-semibold text-foreground">#{position}</span>
          </div>
        )}

        {/* Referral share */}
        {referralUrl && (
          <div className="space-y-2 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
              {t("success.referral.title")}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              {t("success.referral.description")}
            </p>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={referralUrl}
                className="text-xs h-8 font-mono bg-muted"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-1.5"
                onClick={copyReferral}
              >
                {copied
                  ? <><CheckCheck className="size-3.5" />{t("success.referral.copied")}</>
                  : <><Copy className="size-3.5" />{t("success.referral.copy")}</>
                }
              </Button>
            </div>
          </div>
        )}

        <Button variant="cta-ghost" onClick={() => router.push("/")}>
          {t("success.cta")}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Status check ──────────────────────────────────────────────────────────────

function StatusCheckCard() {
  const t = useTranslations("waitlist");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    position: number;
    status: string;
    referralCode: string | null;
    referralCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/waitlist/status?email=${encodeURIComponent(email)}`);
      if (res.status === 404) {
        setError(t("statusCheck.notFound"));
        return;
      }
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setError(t("statusCheck.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("statusCheck.title")}
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder={t("form.email.placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && check()}
          className="h-8 text-xs"
        />
        <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={check} disabled={loading || !email}>
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : t("statusCheck.cta")}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {result && (
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("statusCheck.position")}</span>
            <span className="text-xs font-semibold tabular-nums">#{result.position}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("statusCheck.status")}</span>
            <span className="text-xs font-semibold capitalize">{result.status.toLowerCase()}</span>
          </div>
          {result.referralCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t("statusCheck.referrals")}</span>
              <span className="text-xs font-semibold tabular-nums">
                {t("statusCheck.referralCount", { count: result.referralCount })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Features strip ────────────────────────────────────────────────────────────

function FeaturesStrip() {
  const t = useTranslations("waitlist");
  const features = [
    { icon: Shield,    key: "budget" as const },
    { icon: Zap,       key: "optimizer" as const },
    { icon: GitBranch, key: "router" as const },
    { icon: Users,     key: "analytics" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      {features.map(({ icon: Icon, key }) => (
        <div key={key} className="flex items-start gap-2.5">
          <div className="size-7 rounded-md bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="size-3.5 text-secondary" />
          </div>
          <div>
            <p className="text-xs font-semibold">{t(`features.${key}.title`)}</p>
            <p className="text-[11px] text-muted-foreground leading-snug">{t(`features.${key}.description`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main form ─────────────────────────────────────────────────────────────────

export function WaitlistForm() {
  const t = useTranslations("waitlist");
  const searchParams = useSearchParams();
  const [position, setPosition] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill referral code from URL ?ref=
  const refFromUrl = searchParams.get("ref") ?? "";

  const waitlistSchema = z.object({
    email: z.string().min(1, t("form.email.required")).email(t("form.email.invalid")),
    name: z.string().optional(),
    company: z.string().optional(),
    useCase: z.string().optional(),
    referralCode: z.string().optional(),
  });

  const form = useForm<z.infer<typeof waitlistSchema>>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { email: "", name: "", company: "", useCase: "", referralCode: refFromUrl },
  });

  // Update referralCode field if URL param changes after mount
  useEffect(() => {
    if (refFromUrl) form.setValue("referralCode", refFromUrl);
  }, [refFromUrl, form]);

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof waitlistSchema>) {
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        form.setError("root", {
          message: response.status === 409 ? t("errors.duplicate") : t("errors.failed"),
        });
        return;
      }

      setPosition(data.position);
      setReferralCode(data.referralCode ?? null);
      setSubmitted(true);
    } catch {
      form.setError("root", { message: t("errors.network") });
    }
  }

  if (submitted) return <SuccessCard position={position} referralCode={referralCode} />;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center space-y-3 pb-2">
        <div className="flex justify-center">
          <Logo variant="stacked" iconClassName="w-10 h-10" textClassName="text-2xl" />
        </div>
        <div>
          <CardTitle className="text-2xl">{t("page.title")}</CardTitle>
          <CardDescription className="text-base mt-1">{t("page.subtitle")}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* ── Section 1 : Contact ── */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("section.contact")}
              </p>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <RequiredFormLabel required>{t("form.email.label")}</RequiredFormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t("form.email.placeholder")} autoFocus autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <RequiredFormLabel>{t("form.name.label")}</RequiredFormLabel>
                      <FormControl>
                        <Input placeholder={t("form.name.placeholder")} autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <RequiredFormLabel>{t("form.company.label")}</RequiredFormLabel>
                      <FormControl>
                        <Input placeholder={t("form.company.placeholder")} autoComplete="organization" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* ── Section 2 : Use case ── */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("section.useCase")}
              </p>
              <FormField
                control={form.control}
                name="useCase"
                render={({ field }) => (
                  <FormItem>
                    <RequiredFormLabel>{t("form.useCase.label")}</RequiredFormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.useCase.placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="saas">{t("form.useCase.options.saas")}</SelectItem>
                          <SelectItem value="agent">{t("form.useCase.options.agent")}</SelectItem>
                          <SelectItem value="enterprise">{t("form.useCase.options.enterprise")}</SelectItem>
                          <SelectItem value="dev">{t("form.useCase.options.dev")}</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Referral code (hidden if pre-filled from URL, shown as optional otherwise) */}
            {!refFromUrl && (
              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <RequiredFormLabel>{t("form.referralCode.label")}</RequiredFormLabel>
                    <FormControl>
                      <Input placeholder={t("form.referralCode.placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" variant="cta-accent" disabled={isSubmitting} className="w-full group" size="lg">
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("form.submitting")}</>
              ) : (
                <>{t("form.submit")}<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">{t("page.description")}</p>
          </form>
        </Form>

        <Separator className="my-6" />

        {/* ── Features ── */}
        <FeaturesStrip />

        <Separator className="my-6" />

        {/* ── Status check ── */}
        <StatusCheckCard />
      </CardContent>
    </Card>
  );
}
