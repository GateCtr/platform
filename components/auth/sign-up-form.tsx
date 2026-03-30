"use client";

import { useRef, useState } from "react";
import { useAuth, useSignUp } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Link, useRouter } from "@/i18n/routing";
import { AuthPageShell } from "./auth-page-shell";
import { AuthFormSkeleton } from "./auth-form-skeleton";
import { ClerkCaptchaMount } from "./clerk-captcha-mount";
import { GitHubLogo, GitLabLogo, GoogleLogo } from "./oauth-provider-icons";
import { useAuthLocalePaths } from "./use-auth-locale-paths";
import { clerkErrorToTranslationKey } from "@/lib/auth/clerk-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

type OAuthProvider = "oauth_google" | "oauth_github" | "oauth_gitlab";

export function SignUpForm({
  initialInviteCode,
  waitlistEnabled,
}: {
  initialInviteCode: string;
  waitlistEnabled: boolean;
}) {
  const t = useTranslations("authSignUp");
  const te = useTranslations("authErrors");
  const paths = useAuthLocalePaths();
  const router = useRouter();
  const { isLoaded: authLoaded } = useAuth();
  const { signUp, fetchStatus } = useSignUp();

  const [phase, setPhase] = useState<"details" | "verify">("details");
  const [inviteCode, setInviteCode] = useState(initialInviteCode.trim());
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legal, setLegal] = useState(false);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /** Évite double envoi pendant verify + garde le chargement jusqu’à la navigation. */
  const verifySubmitLockRef = useRef(false);

  const showError = (err: unknown) => {
    setMessage(te(clerkErrorToTranslationKey(err)));
  };

  const mapInviteReason = (reason: string) => {
    if (reason === "not_found") return te("inviteNotFound");
    if (reason === "expired") return te("inviteExpired");
    if (reason === "used") return te("inviteUsed");
    if (reason === "email_mismatch") return te("inviteEmailMismatch");
    return te("generic");
  };

  const verifyWaitlistInvite = async () => {
    if (!waitlistEnabled || !inviteCode.trim()) {
      if (waitlistEnabled) {
        setMessage(t("inviteRequired"));
        return false;
      }
      return true;
    }
    const res = await fetch("/api/waitlist/invite/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: inviteCode.trim(),
        email: email.trim() || undefined,
      }),
    });
    const data = (await res.json()) as {
      valid?: boolean;
      reason?: string;
    };
    if (!data.valid) {
      setMessage(mapInviteReason(data.reason ?? "not_found"));
      return false;
    }
    return true;
  };

  /** Retourne `true` si la session est finalisée et la navigation lancée (ne pas remettre pending à false). */
  const finalizeSignUp = async (): Promise<boolean> => {
    if (!signUp || signUp.status !== "complete") return false;
    try {
      await signUp.finalize({
        navigate: async ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          const url = decorateUrl(paths.dashboard);
          if (url.startsWith("http")) {
            window.location.href = url;
            return;
          }
          await router.push(url);
        },
      });
      return true;
    } catch (e) {
      showError(e);
      return false;
    }
  };

  const onDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    if (!legal) {
      setMessage(t("legalRequired"));
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      const okInvite = await verifyWaitlistInvite();
      if (!okInvite) {
        setPending(false);
        return;
      }

      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        legalAccepted: legal,
      });
      if (error) {
        showError(error);
        return;
      }

      await signUp.verifications.sendEmailCode();

      setPhase("verify");
    } catch (err) {
      showError(err);
    } finally {
      setPending(false);
    }
  };

  const onVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || verifySubmitLockRef.current) return;
    if (code.trim().length !== 6) return;

    verifySubmitLockRef.current = true;
    setPending(true);
    setMessage(null);

    const release = () => {
      verifySubmitLockRef.current = false;
      setPending(false);
    };

    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });
      if (error) {
        showError(error);
        release();
        return;
      }

      if (signUp.status === "complete") {
        const navigated = await finalizeSignUp();
        if (!navigated) release();
        return;
      }

      setMessage(te("signUpIncomplete"));
      release();
    } catch (err) {
      showError(err);
      release();
    }
  };

  const startOAuth = async (strategy: OAuthProvider) => {
    if (!signUp) return;
    if (!legal && waitlistEnabled) {
      setMessage(t("legalRequired"));
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      if (waitlistEnabled) {
        const ok = await verifyWaitlistInvite();
        if (!ok) {
          setPending(false);
          return;
        }
      }
      const { error } = await signUp.sso({
        strategy,
        redirectUrl: paths.withOrigin(paths.dashboard),
        redirectCallbackUrl: paths.withOrigin(paths.ssoCallback),
        legalAccepted: legal,
      });
      if (error) showError(error);
    } catch (err) {
      showError(err);
    } finally {
      setPending(false);
    }
  };

  if (!authLoaded || !signUp || fetchStatus === "fetching") {
    return (
      <AuthPageShell title={t("title")} subtitle={t("subtitle")}>
        <ClerkCaptchaMount />
        <AuthFormSkeleton variant="sign-up" />
      </AuthPageShell>
    );
  }

  if (phase === "verify") {
    return (
      <AuthPageShell
        title={t("verifyTitle")}
        subtitle={t("verifySubtitle", { email })}
      >
        <form onSubmit={onVerifySubmit} className="space-y-4">
          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="verify-code-otp">{t("verifyCodeLabel")}</Label>
            <InputOTP
              id="verify-code-otp"
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={setCode}
              disabled={pending}
              containerClassName="justify-center sm:justify-start"
              aria-invalid={message ? true : undefined}
            >
              <InputOTPGroup className="gap-1.5">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-muted-foreground">
              {t("verifyCodeHint")}
            </p>
          </div>
          <ClerkCaptchaMount />
          <Button
            type="submit"
            className="w-full"
            variant="cta-accent"
            size="lg"
            disabled={pending || code.length !== 6}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("verifySubmitting")}
              </>
            ) : (
              t("verifySubmit")
            )}
          </Button>
          {pending ? (
            <p className="text-center text-sm text-muted-foreground">
              {t("verifyFinishing")}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={async () => {
              setMessage(null);
              await signUp.verifications.sendEmailCode();
            }}
          >
            {t("verifyResend")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              verifySubmitLockRef.current = false;
              setPending(false);
              setPhase("details");
              setCode("");
              setMessage(null);
            }}
          >
            {t("verifyBack")}
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

        <form onSubmit={onDetailsSubmit} className="space-y-4">
          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          {waitlistEnabled ? (
            <div className="space-y-2">
              <Label htmlFor="invite">{t("inviteLabel")}</Label>
              <Input
                id="invite"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder={t("invitePlaceholder")}
                autoComplete="off"
                required
              />
              <p className="text-xs text-muted-foreground">{t("inviteHint")}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("firstNameLabel")}</Label>
              <Input
                id="firstName"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("lastNameLabel")}</Label>
              <Input
                id="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {waitlistEnabled ? (
              <p className="text-xs text-muted-foreground">
                {t("emailWaitlistHint")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 rounded-lg border border-border/80 bg-muted/30 p-3">
            <Checkbox
              id="legal"
              checked={legal}
              onCheckedChange={(v) => setLegal(v === true)}
              className="mt-0.5"
            />
            <label htmlFor="legal" className="text-sm leading-snug">
              {t("legalLead")}{" "}
              <Link
                href="/terms"
                className="font-medium text-primary underline"
              >
                {t("legalTerms")}
              </Link>{" "}
              {t("legalBetween")}{" "}
              <Link
                href="/privacy"
                className="font-medium text-primary underline"
              >
                {t("legalPrivacy")}
              </Link>
              .
            </label>
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
          {t("hasAccount")}{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary hover:underline"
          >
            {t("signInCta")}
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
