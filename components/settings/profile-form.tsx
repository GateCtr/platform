"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/app/[locale]/(dashboard)/settings/profile/_actions";
import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  authProvider: string | null;
  locale: string;
}

export function ProfileForm({
  name: initialName,
  email,
  avatarUrl,
  authProvider,
  locale,
}: ProfileFormProps) {
  const t = useTranslations("settingsProfile");
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const providerKey = (authProvider ?? "email") as
    | "email"
    | "google"
    | "github"
    | "microsoft"
    | "apple";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const fd = new FormData();
    fd.set("name", name);

    startTransition(async () => {
      const result = await updateProfile(fd);
      if (result.error) {
        setError(t(`errors.${result.error}` as Parameters<typeof t>[0]));
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  function handleLocaleChange(newLocale: string) {
    router.replace("/settings/profile", { locale: newLocale });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* ── Identity ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">{t("sections.identity")}</h2>
          <Separator className="mt-2" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-xl">
              <AvatarImage src={avatarUrl ?? undefined} alt={name} />
              <AvatarFallback className="text-lg font-semibold rounded-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("fields.name.label")}</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("fields.name.placeholder")}
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground">
              {t("fields.name.description")}
            </p>
          </div>

          {/* Email — read-only */}
          <div className="space-y-1.5">
            <Label>{t("fields.email.label")}</Label>
            <Input value={email} disabled />
            <p className="text-xs text-muted-foreground">
              {t("fields.email.description")}
            </p>
          </div>

          {/* Auth provider — read-only badge */}
          <div className="space-y-1.5">
            <Label>{t("fields.authProvider.label")}</Label>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground border border-border">
                {t(`fields.authProvider.${providerKey}`)}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="cta-primary"
              disabled={isPending || name.trim().length < 2}
            >
              {isPending ? t("actions.saving") : t("actions.save")}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Check className="size-3.5 text-green-500" />
                {t("actions.saved")}
              </span>
            )}
          </div>
        </form>
      </section>

      {/* ── Preferences ── */}      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">{t("sections.preferences")}</h2>
          <Separator className="mt-2" />
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <Label>{t("fields.language.label")}</Label>
          <div className="flex items-center gap-2">
            {(["en", "fr"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => handleLocaleChange(l)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
                  locale === l
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
                )}
              >
                {t(`fields.language.${l}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="space-y-1.5">
          <Label>{t("fields.theme.label")}</Label>
          <ThemeSwitcher />
        </div>
      </section>

    </div>
  );
}
