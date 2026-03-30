"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useLocale } from "next-intl";

export function SsoCallbackClient() {
  const locale = useLocale();
  const p = locale === "fr" ? "/fr" : "";

  return (
    <AuthenticateWithRedirectCallback
      signInUrl={`${p}/sign-in`}
      signUpUrl={`${p}/sign-up`}
      continueSignUpUrl={`${p}/sign-up`}
      signInFallbackRedirectUrl={`${p}/dashboard`}
      signUpFallbackRedirectUrl={`${p}/dashboard`}
      resetPasswordUrl={`${p}/forgot-password`}
    />
  );
}
