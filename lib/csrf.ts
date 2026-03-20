import { headers } from "next/headers";

/**
 * CSRF protection for Next.js Server Actions.
 *
 * Next.js 14+ Server Actions already include built-in CSRF protection via
 * the `Origin` header check. This helper adds an explicit layer for
 * defense-in-depth: it verifies the request origin matches the app URL.
 *
 * Usage in server actions:
 *   await validateCsrf();
 *
 * @throws Error if the origin is invalid (should be caught and returned as 403)
 */
export async function validateCsrf(): Promise<void> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) return; // Skip in environments without APP_URL configured

  // Allow requests with no origin (server-to-server, curl in dev)
  if (!origin) return;

  try {
    const originHost = new URL(origin).host;
    const appHost = new URL(appUrl).host;

    if (originHost !== appHost) {
      throw new Error(`CSRF: invalid origin ${origin}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("CSRF:")) throw err;
    // Malformed origin header — reject
    throw new Error(`CSRF: malformed origin header`);
  }
}
