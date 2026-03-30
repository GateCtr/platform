"use client";

import { useState } from "react";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { AuthPageShell } from "./auth-page-shell";
import { AuthFormSkeleton } from "./auth-form-skeleton";
import { ClerkCaptchaMount } from "./clerk-captcha-mount";
import { GitHubLogo, GitLabLogo, GoogleLogo } from "./oauth-provider-icons";
import { useAuthLocalePaths } from "./use-auth-locale-paths";
import { clerkErrorToTranslationKey } from "@/lib/auth/clerk-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type OAuthProvider = "oauth_google" | "oauth_github" | "oauth_gitlab";

export function SignInForm() {
  const t = useTranslations("authSignIn");
  const te = useTranslations("authErrors");
  const paths = useAuthLocalePaths();
  const router = useRouter();
  const { isLoaded: authLoaded } = useAuth();
  const { signIn, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [step, setStep] = useState<"password" | "mfa">("password");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const showError = (err: unknown) => {
    const key = clerkErrorToTranslationKey(err);
    setMessage(te(key));
  };

  const finalizeSession = async () => {
    if (!signIn || signIn.status !== "complete") return;
    setPending(true);
    setMessage(null);
    try {
      await signIn.finalize({
        navigate: async ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          const url = decorateUrl(paths.dashboard);
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
    } catch (e) {
      showError(e);
    } finally {
      setPending(false);
    }
  };

  const onPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setPending(true);
    setMessage(null);
    try {
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });
      if (error) {
        showError(error);
        return;
      }

      if (signIn.status === "complete") {
        await finalizeSession();
        return;
      }

      if (signIn.status === "needs_second_factor") {
        setStep("mfa");
        return;
      }

      if (signIn.status === "needs_client_trust") {
        const factor = signIn.supportedSecondFactors?.find(
          (f) => f.strategy === "email_code",
        );
        if (factor) {
          await signIn.mfa.sendEmailCode();
        }
        setStep("mfa");
        return;
      }

      setMessage(te("generic"));
    } catch (err) {
      showError(err);
    } finally {
      setPending(false);
    }
  };

  const onMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setPending(true);
    setMessage(null);
    try {
      await signIn.mfa.verifyEmailCode({ code: mfaCode.trim() });
      if (signIn.status === "complete") {
        await finalizeSession();
      } else {
        setMessage(te("generic"));
      }
    } catch (err) {
      showError(err);
    } finally {
      setPending(false);
    }
  };

  const startOAuth = async (strategy: OAuthProvider) => {
    if (!signIn) return;
    setPending(true);
    setMessage(null);
    try {
      const { error } = await signIn.sso({
        strategy,
        redirectUrl: paths.withOrigin(paths.dashboard),
        redirectCallbackUrl: paths.withOrigin(paths.ssoCallback),
      });
      if (error) showError(error);
    } catch (err) {
      showError(err);
    } finally {
      setPending(false);
    }
  };

  if (!authLoaded || !signIn || fetchStatus === "fetching") {
    return (
      <AuthPageShell title={t("title")} subtitle={t("subtitle")}>
        <ClerkCaptchaMount />
        <AuthFormSkeleton variant="sign-in" />
      </AuthPageShell>
    );
  }

  if (step === "mfa") {
    return (
      <AuthPageShell title={t("mfaTitle")} subtitle={t("mfaSubtitle")}>
        <form onSubmit={onMfaSubmit} className="space-y-4">
          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="mfa-code">{t("mfaCodeLabel")}</Label>
            <Input
              id="mfa-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            variant="cta-accent"
            disabled={pending}
          >
            {pending ? t("submitting") : t("mfaSubmit")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setStep("password");
              setMfaCode("");
              setMessage(null);
            }}
          >
            {t("mfaBack")}
          </Button>
        </form>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell title={t("title")} subtitle={t("subtitle")}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={pending}
            onClick={() => startOAuth("oauth_google")}
          >
            <GoogleLogo />
            {t("oauthGoogle")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={pending}
            onClick={() => startOAuth("oauth_github")}
          >
            <GitHubLogo />
            {t("oauthGithub")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={pending}
            onClick={() => startOAuth("oauth_gitlab")}
          >
            <GitLabLogo />
            {t("oauthGitlab")}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {t("divider")}
            </span>
          </div>
        </div>

        <form onSubmit={onPasswordSignIn} className="space-y-4">
          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <ClerkCaptchaMount />

          <Button
            type="submit"
            className="w-full"
            variant="cta-accent"
            size="lg"
            disabled={pending}
          >
            {pending ? t("submitting") : t("submit")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary hover:underline"
          >
            {t("signUpCta")}
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
