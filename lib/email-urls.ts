import type { EmailLocale } from "@/lib/email-messages";

const DEFAULT_MARKETING_URL = "https://www.gatectr.com";
const DEFAULT_APP_URL = "https://app.gatectr.com";

/** Public marketing + legal site (e.g. gatectr.com). */
export function emailMarketingBase(): string {
  return (
    process.env.NEXT_PUBLIC_MARKETING_URL || DEFAULT_MARKETING_URL
  ).replace(/\/$/, "");
}

/** Auth, dashboard, billing (e.g. app.gatectr.com). */
export function emailAppBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL).replace(
    /\/$/,
    "",
  );
}

/** Marketing URL; `path` must start with `/`, may include `?query`. */
export function emailMarketingUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${emailMarketingBase()}${p}`;
}

/** App URL; `path` must start with `/`, may include `?query`. */
export function emailAppUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${emailAppBase()}${p}`;
}

/**
 * Same locale rules as next-intl `localePrefix: "as-needed"`: no `/en` prefix, `/fr` for French.
 */
export function emailAppLocaleUrl(locale: EmailLocale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const prefix = locale === "fr" ? "/fr" : "";
  return `${emailAppBase()}${prefix}${normalized}`;
}

export function emailMarketingLocaleUrl(
  locale: EmailLocale,
  path: string,
): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const prefix = locale === "fr" ? "/fr" : "";
  return `${emailMarketingBase()}${prefix}${normalized}`;
}
