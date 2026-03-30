"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  AlertTriangle,
  ExternalLink,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RequiredFormLabel } from "@/components/shared/required-form-label";
import { cn } from "@/lib/utils";
import { PROVIDER_LIST, type ProviderId } from "@/lib/providers";
import { connectProvider } from "../_actions";

type ProviderValues = { provider: ProviderId; apiKey: string; name: string };

interface ProviderStepProps {
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

// Provider brand colors (using CSS-safe classes)
const PROVIDER_STYLES: Record<
  ProviderId,
  { bg: string; border: string; text: string; dot: string }
> = {
  openai: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  anthropic: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  mistral: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  gemini: {
    bg: "bg-sky-50 dark:bg-sky-950/20",
    border: "border-sky-200 dark:border-sky-800",
    text: "text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
  },
};

export function ProviderStep({
  onComplete,
  onSkip,
  onBack,
}: ProviderStepProps) {
  const t = useTranslations("onboarding.provider");
  const tNav = useTranslations("onboarding.nav");
  const tErr = useTranslations("onboarding.errors");

  const [selectedProvider, setSelectedProvider] =
    useState<ProviderId>("openai");
  const [showKey, setShowKey] = useState(false);

  const schema = z.object({
    provider: z.enum(["openai", "anthropic", "mistral", "gemini"]),
    apiKey: z.string().min(1, t("errors.keyRequired")),
    name: z.string(),
  });

  const form = useForm<ProviderValues>({
    resolver: zodResolver(schema),
    defaultValues: { provider: "openai", apiKey: "", name: "" },
  });

  const { isSubmitting } = form.formState;
  const currentProvider = PROVIDER_LIST.find((p) => p.id === selectedProvider);

  async function onSubmit(values: ProviderValues) {
    const fd = new FormData();
    fd.set("provider", values.provider);
    fd.set("apiKey", values.apiKey);
    fd.set("name", values.name || "Default");
    let res: Awaited<ReturnType<typeof connectProvider>>;
    try {
      res = await connectProvider(fd);
    } catch {
      form.setError("root", { message: t("errors.failed") });
      return;
    }
    if (res?.error) {
      const message =
        res.error === "csrf_invalid"
          ? tErr("csrfInvalid")
          : res.error === "provider_required"
            ? t("errors.providerRequired")
            : res.error === "key_required"
              ? t("errors.keyRequired")
              : t("errors.failed");
      form.setError("root", { message });
      return;
    }
    onComplete();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Provider grid */}
        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <RequiredFormLabel required>
                {t("providerLabel")}
              </RequiredFormLabel>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {PROVIDER_LIST.map((p) => {
                  const selected = selectedProvider === p.id;
                  const s = PROVIDER_STYLES[p.id];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        field.onChange(p.id);
                        setSelectedProvider(p.id);
                      }}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200",
                        selected
                          ? `${s.border} ${s.bg} shadow-sm`
                          : "border-border hover:border-primary/30 hover:bg-accent/20",
                      )}
                    >
                      {/* Color dot */}
                      <div
                        className={cn("h-2 w-2 rounded-full shrink-0", s.dot)}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-semibold leading-none mb-0.5",
                            selected ? s.text : "text-foreground",
                          )}
                        >
                          {p.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.description}
                        </p>
                      </div>
                      {selected && (
                        <CheckCircle2
                          className={cn("h-4 w-4 shrink-0", s.text)}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* API Key */}
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <RequiredFormLabel required>{t("keyLabel")}</RequiredFormLabel>
                <a
                  href={currentProvider?.docsUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("whereToFind")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder={currentProvider?.keyPlaceholder ?? "sk-..."}
                    autoComplete="off"
                    className="h-11 pr-10 font-mono text-sm"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Security badge */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">{t("keyHint")}</p>
          <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">
            AES-256
          </Badge>
        </div>

        {/* Key name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <RequiredFormLabel>{t("nameLabel")}</RequiredFormLabel>
              <FormControl>
                <Input
                  placeholder={t("namePlaceholder")}
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          variant="cta-primary"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          <span className="inline-flex items-center justify-center gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span>{isSubmitting ? t("connecting") : t("submit")}</span>
          </span>
        </Button>

        {/* Skip section */}
        <div className="space-y-2">
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
              {t("skipWarning")}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="cta-ghost"
              size="sm"
              className="flex-1"
              onClick={onBack}
            >
              {tNav("back")}
            </Button>
            <Button
              type="button"
              variant="cta-ghost"
              size="sm"
              className="flex-1"
              onClick={onSkip}
            >
              {t("skip")}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
