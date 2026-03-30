export type AppLocale = "en" | "fr";

const LOCALES: AppLocale[] = ["en", "fr"];

export function normalizeLocale(raw: unknown): AppLocale {
  if (raw === "fr" || raw === "en") return raw;
  if (typeof raw === "string" && LOCALES.includes(raw as AppLocale)) {
    return raw as AppLocale;
  }
  return "en";
}

/** Parse Accept-Language: treat any listed French variant as fr. */
export function localeFromAcceptLanguage(
  header: string | null | undefined,
): AppLocale {
  if (!header?.trim()) return "en";
  for (const part of header.split(",")) {
    const tag = part.trim().split(";")[0]?.trim().toLowerCase() ?? "";
    if (tag.startsWith("fr")) return "fr";
  }
  return "en";
}

type Metadata = Record<string, unknown> | null | undefined;

/** Clerk webhooks may use snake_case or camelCase. */
export function clerkUserPayloadMetadata(data: Record<string, unknown>): {
  publicMetadata?: Record<string, unknown>;
  unsafeMetadata?: Record<string, unknown>;
} {
  const pub =
    (data.public_metadata as Record<string, unknown> | undefined) ??
    (data.publicMetadata as Record<string, unknown> | undefined);
  const unsafe =
    (data.unsafe_metadata as Record<string, unknown> | undefined) ??
    (data.unsafeMetadata as Record<string, unknown> | undefined);
  return { publicMetadata: pub, unsafeMetadata: unsafe };
}

/**
 * Locale for a brand-new Clerk user (before our DB row exists).
 * 1) Clerk publicMetadata.locale (if key is present)
 * 2) Clerk unsafeMetadata.locale (if key is present)
 * 3) Accept-Language on the webhook request
 */
export function resolveLocaleForNewClerkUser(opts: {
  publicMetadata?: Metadata;
  unsafeMetadata?: Metadata;
  acceptLanguageHeader?: string | null;
}): AppLocale {
  const pub = opts.publicMetadata;
  if (pub != null && Object.prototype.hasOwnProperty.call(pub, "locale")) {
    return normalizeLocale(pub.locale);
  }
  const unsafe = opts.unsafeMetadata;
  if (
    unsafe != null &&
    Object.prototype.hasOwnProperty.call(unsafe, "locale")
  ) {
    return normalizeLocale(unsafe.locale);
  }
  return localeFromAcceptLanguage(opts.acceptLanguageHeader);
}

export function mergeUserMetadata(
  existing: unknown,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  return { ...base, ...patch };
}
