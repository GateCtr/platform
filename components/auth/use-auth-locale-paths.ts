"use client";

import { useLocale } from "next-intl";

/** Paths aligned with `localePrefix: "as-needed"` (no `/en`). */
export function useAuthLocalePaths() {
  const locale = useLocale();
  const prefix = locale === "fr" ? "/fr" : "";

  const withOrigin = (path: string) => {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  };

  return {
    locale,
    prefix,
    dashboard: `${prefix}/dashboard`,
    signIn: `${prefix}/sign-in`,
    signUp: `${prefix}/sign-up`,
    forgotPassword: `${prefix}/forgot-password`,
    ssoCallback: `${prefix}/sign-in/sso-callback`,
    privacy: `${prefix}/privacy`,
    terms: `${prefix}/terms`,
    withOrigin,
  };
}
