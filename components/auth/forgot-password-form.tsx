"use client";

import { useState } from "react";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { AuthPageShell } from "./auth-page-shell";
import { AuthFormSkeleton } from "./auth-form-skeleton";
import { ClerkCaptchaMount } from "./clerk-captcha-mount";
import { useAuthLocalePaths } from "./use-auth-locale-paths";
import { clerkErrorToTranslationKey } from "@/lib/auth/clerk-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const t = useTranslations("authForgotPassword");
  const te = useTranslations("authErrors");
  const paths = useAuthLocalePaths();
  const router = useRouter();
  const { isLoaded: authLoaded } = useAuth();
  const { signIn, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const showError = (err: unknown) => {
    setMessage(te(clerkErrorToTranslationKey(err)));
  };

  const finalizeIfComplete = async () => {
    if (!signIn || signIn.status !== "complete") return;
    setPending(true);
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

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setPending(true);
    setMessage(null);
    try {
      const { error: createError } = await signIn.create({
        identifier: email.trim(),
      });
      if (createError) {
        showError(createError);
        return;
      }
      const { error: sendErr } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendErr) {
        showError(sendErr);
        return;
      }
      setCodeSent(true);
    } catch (err) {
      showError(err);
    } finally {
      setPending(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setPending(true);
    setMessage(null);
    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({
        code: code.trim(),
      });
      if (error) {
        showError(error);
        return;
      }
    } catch (err) {
      showError(err);
    } finally {
      setPending(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setPending(true);
    setMessage(null);
    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
      });
      if (error) {
        showError(error);
        return;
      }
      if (signIn.status === "needs_second_factor") {
        setMessage(t("mfaNote"));
        return;
      }
      await finalizeIfComplete();
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
        <AuthFormSkeleton variant="forgot-password" />
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell title={t("title")} subtitle={t("subtitle")}>
      <div className="space-y-4">
        {message ? (
          <Alert
            variant={
              signIn.status === "needs_second_factor"
                ? "default"
                : "destructive"
            }
          >
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        {!codeSent ? (
          <form onSubmit={sendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fp-email">{t("emailLabel")}</Label>
              <Input
                id="fp-email"
                type="email"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <ClerkCaptchaMount />
            <Button
              type="submit"
              className="w-full"
              variant="cta-accent"
              disabled={pending}
            >
              {pending ? t("sending") : t("sendCode")}
            </Button>
          </form>
        ) : null}

        {codeSent && signIn.status !== "needs_new_password" ? (
          <form onSubmit={verifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fp-code">{t("codeLabel")}</Label>
              <Input
                id="fp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={t("codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              variant="cta-accent"
              disabled={pending}
            >
              {pending ? t("verifying") : t("verifyCode")}
            </Button>
          </form>
        ) : null}

        {signIn.status === "needs_new_password" ? (
          <form onSubmit={submitPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fp-password">{t("newPasswordLabel")}</Label>
              <Input
                id="fp-password"
                type="password"
                autoComplete="new-password"
                placeholder={t("newPasswordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              variant="cta-accent"
              disabled={pending}
            >
              {pending ? t("setting") : t("setPassword")}
            </Button>
          </form>
        ) : null}

        <Button variant="ghost" className="w-full" asChild>
          <Link href="/sign-in">{t("backToSignIn")}</Link>
        </Button>
      </div>
    </AuthPageShell>
  );
}
