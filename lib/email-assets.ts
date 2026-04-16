import { emailMarketingUrl } from "@/lib/email-urls";

/**
 * Absolute URL for `public/` assets used in emails.
 *
 * Uses EMAIL_ASSET_BASE_URL if set (recommended for dev — point to prod or a CDN).
 * Falls back to NEXT_PUBLIC_MARKETING_URL → https://gatectr.com.
 *
 * Gmail and other clients cannot load images from localhost — always use
 * a publicly accessible URL when sending real emails.
 */
export function emailPublicAssetUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;

  // Dedicated override for email assets — avoids localhost in dev
  const base = process.env.EMAIL_ASSET_BASE_URL;
  if (base) return `${base.replace(/\/$/, "")}${p}`;

  return emailMarketingUrl(p);
}
