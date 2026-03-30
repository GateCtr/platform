import { emailMarketingUrl } from "@/lib/email-urls";

/** Absolute URL for `public/` assets (served from the marketing origin, e.g. gatectr.com). */
export function emailPublicAssetUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return emailMarketingUrl(p);
}
