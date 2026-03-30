import { headers } from "next/headers";

/** Comma-separated extra base URLs allowed as `Origin` (tunnels, preview hosts). Server-only. */
function extraAllowedHosts(): Set<string> {
  const raw = process.env.CSRF_EXTRA_ORIGINS ?? "";
  const hosts = new Set<string>();
  for (const part of raw.split(",")) {
    const s = part.trim();
    if (!s) continue;
    try {
      hosts.add(new URL(s).host);
    } catch {
      /* ignore invalid entries */
    }
  }
  return hosts;
}

/**
 * CSRF protection for Next.js Server Actions.
 *
 * Next.js 14+ Server Actions already include built-in CSRF protection via
 * the `Origin` header check. This helper adds an explicit layer for
 * defense-in-depth: it verifies the request origin matches the app URL.
 *
 * In **development** (`NODE_ENV=development`), this check is skipped so tunnels
 * and alternate hosts work without `CSRF_EXTRA_ORIGINS`. In production, if you
 * open the app via another host (e.g. Cloudflare Tunnel) while
 * `NEXT_PUBLIC_APP_URL` points elsewhere, set `CSRF_EXTRA_ORIGINS` to that
 * tunnel base URL so server actions are not rejected.
 *
 * Usage in server actions:
 *   await validateCsrf();
 *
 * @throws Error if the origin is invalid (should be caught and returned as 403)
 */
export async function validateCsrf(): Promise<void> {
  // En dev, l’origine diffère souvent (tunnel, autre host) ; Next.js valide déjà l’action.
  if (process.env.NODE_ENV === "development") return;

  const headersList = await headers();
  const origin = headersList.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) return; // Skip in environments without APP_URL configured

  // Allow requests with no origin (server-to-server, curl in dev)
  if (!origin) return;

  try {
    const originHost = new URL(origin).host;
    const appHost = new URL(appUrl).host;
    const allowed = new Set([appHost, ...extraAllowedHosts()]);

    if (!allowed.has(originHost)) {
      throw new Error(`CSRF: invalid origin ${origin}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("CSRF:")) throw err;
    // Malformed origin header — reject
    throw new Error(`CSRF: malformed origin header`);
  }
}
