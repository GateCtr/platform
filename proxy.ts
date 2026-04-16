import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { geolocation } from "@vercel/functions";
import { routing } from "./i18n/routing";
import { ALLOWED_COUNTRIES } from "./config/geo-allowed-countries";
import { applySecurityHeaders } from "@/lib/security-headers";
import type { RoleName } from "@/types/globals";

// Create the i18n middleware
const intlMiddleware = createIntlMiddleware(routing);

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/(en|fr)",
  "/(en|fr)/features",
  "/features",
  "/(en|fr)/pricing",
  "/pricing",
  "/(en|fr)/waitlist",
  "/waitlist",
  "/(en|fr)/docs(.*)",
  "/docs(.*)",
  "/(en|fr)/changelog(.*)",
  "/changelog(.*)",
  "/(en|fr)/blocked",
  "/blocked",
  "/(en|fr)/status(.*)",
  "/status(.*)",
  "/(en|fr)/privacy",
  "/privacy",
  "/(en|fr)/terms",
  "/terms",
  "/(en|fr)/cookies",
  "/cookies",
  "/(en|fr)/about",
  "/about",
  "/(en|fr)/careers",
  "/careers",
  "/(en|fr)/launch",
  "/launch",
  "/(en|fr)/sign-in(.*)",
  "/sign-in(.*)",
  "/(en|fr)/sign-up(.*)",
  "/sign-up(.*)",
  "/(en|fr)/onboarding",
  "/onboarding",
  "/api/waitlist(.*)",
  "/api/v1/(.*)",
  "/api/health",
  "/api/auth/refresh",
  "/api/audit",
  "/sitemap.xml",
  "/robots.txt",
]);

// Admin routes requiring RBAC check
const isAdminRoute = createRouteMatcher(["/((?:fr)/)?admin(.*)"]);

// Onboarding route
const isOnboardingRoute = createRouteMatcher(["/onboarding", "/fr/onboarding"]);

/** Allowed redirect hosts */
const ALLOWED_REDIRECT_HOSTS = new Set([
  "localhost:3000",
  "localhost:5000",
  "app.gatectr.com",
  ...(process.env.NEXT_PUBLIC_APP_URL
    ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host]
    : []),
]);

function sanitizeRedirectUrl(
  raw: string | null,
  requestUrl: string,
): string | null {
  if (!raw) return null;
  try {
    const base = new URL(requestUrl);
    const target = new URL(raw, base);
    if (!ALLOWED_REDIRECT_HOSTS.has(target.host)) return null;
    return target.pathname + target.search + target.hash;
  } catch {
    return null;
  }
}

// ── Shared geo + marketing logic (no auth) ────────────────────────────────────
function handlePreAuth(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const isDev = process.env.NODE_ENV !== "production";
  const isAppSubdomain = isDev || host.startsWith("app.");
  const secure = (res: NextResponse) => applySecurityHeaders(res);

  // Geo-blocking
  const geoEnabled = process.env.ENABLE_GEO_BLOCKING === "true";
  const isBlockedPage = pathname === "/blocked" || pathname === "/fr/blocked";
  if (geoEnabled && !isBlockedPage && !pathname.startsWith("/api")) {
    const { country } = geolocation(req);
    if (country && !ALLOWED_COUNTRIES.includes(country)) {
      const blockedPath = pathname.startsWith("/fr")
        ? "/fr/blocked"
        : "/blocked";
      return secure(NextResponse.redirect(new URL(blockedPath, req.url)));
    }
  }

  // Marketing domain — bypass Clerk
  if (!isAppSubdomain && !isDev && host !== "status.gatectr.com") {
    if (pathname === "/opengraph-image" || pathname.startsWith("/api/")) {
      return secure(NextResponse.next());
    }
    const appRoutes = [
      "/dashboard",
      "/fr/dashboard",
      "/onboarding",
      "/fr/onboarding",
      "/admin",
      "/fr/admin",
      "/sign-in",
      "/fr/sign-in",
      "/sign-up",
      "/fr/sign-up",
    ];
    const appBase =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gatectr.com";
    if (appRoutes.some((r) => pathname.startsWith(r))) {
      return secure(
        NextResponse.redirect(new URL(pathname + req.nextUrl.search, appBase)),
      );
    }
    const waitlistEnabled = process.env.ENABLE_WAITLIST === "true";
    const isHomePage =
      pathname === "/" || pathname === "/fr" || pathname === "/fr/";
    if (waitlistEnabled && isHomePage && !pathname.includes("/waitlist")) {
      const waitlistPath = pathname.startsWith("/fr")
        ? "/fr/waitlist"
        : "/waitlist";
      return secure(NextResponse.redirect(new URL(waitlistPath, req.url)));
    }
    return secure(intlMiddleware(req));
  }

  // api.gatectr.com
  if (host === "api.gatectr.com") {
    if (pathname.startsWith("/v1/")) {
      const rewriteUrl = new URL(`/api${pathname}`, req.url);
      rewriteUrl.search = req.nextUrl.search;
      return secure(NextResponse.rewrite(rewriteUrl));
    }
    if (pathname === "/health") {
      return secure(NextResponse.rewrite(new URL("/api/health", req.url)));
    }
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // status.gatectr.com
  if (host === "status.gatectr.com") {
    const STATUS_PATHS: Record<string, string> = {
      "/": "/en/status",
      "": "/en/status",
      "/history": "/en/status/history",
    };
    const target = STATUS_PATHS[pathname];
    if (target) {
      if (pathname !== target)
        return secure(NextResponse.rewrite(new URL(target, req.url)));
      return secure(intlMiddleware(req));
    }
    const marketingBase =
      process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://gatectr.com";
    return secure(
      NextResponse.redirect(
        new URL(pathname + req.nextUrl.search, marketingBase),
      ),
    );
  }

  // App subdomain: redirect marketing routes to gatectr.com
  if (isAppSubdomain && !isDev) {
    const marketingRoutes = [
      "/waitlist",
      "/fr/waitlist",
      "/features",
      "/fr/features",
      "/pricing",
      "/fr/pricing",
      "/changelog",
      "/fr/changelog",
    ];
    if (
      marketingRoutes.some(
        (r) => pathname === r || pathname.startsWith(r + "/"),
      )
    ) {
      const marketingBase =
        process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://gatectr.com";
      return secure(NextResponse.redirect(new URL(pathname, marketingBase)));
    }
  }

  return null; // continue to auth
}

// ── Dev middleware: no Clerk, just intl ───────────────────────────────────────
async function devMiddleware(req: NextRequest): Promise<NextResponse> {
  const secure = (res: NextResponse) => applySecurityHeaders(res);

  const preAuth = handlePreAuth(req);
  if (preAuth) return preAuth;

  // In dev without Clerk auth, just serve via intl
  return secure(intlMiddleware(req));
}

// ── Production middleware: full Clerk + RBAC ──────────────────────────────────
const prodMiddleware = clerkMiddleware(
  async (auth, req) => {
    const preAuth = handlePreAuth(req);
    if (preAuth) return preAuth;

    const { pathname } = req.nextUrl;
    const secure = (res: NextResponse) => applySecurityHeaders(res);

    // Clerk cookie desync — let Clerk handle the handshake natively
    // Do NOT redirect or clear cookies here; intercepting the handshake
    // causes an infinite loop. Clerk will resolve it and redirect to the app.
    const hsReason = req.nextUrl.searchParams.get("__clerk_hs_reason");
    const isHandshake =
      req.nextUrl.searchParams.has("__clerk_handshake") ||
      req.nextUrl.searchParams.has("__clerk_hs_reason") ||
      req.headers.get("x-clerk-auth-status") === "handshake";

    if (isHandshake) {
      // Let Clerk middleware resolve the handshake — do not interfere
      return secure(NextResponse.next());
    }

    // Legacy: clear stale cookies only when NOT in a handshake flow
    if (hsReason === "session-token-but-no-client-uat" && !isHandshake) {
      const signInPath = pathname.startsWith("/fr")
        ? "/fr/sign-in"
        : "/sign-in";
      const res = NextResponse.redirect(new URL(signInPath, req.url));
      for (const cookieName of [
        "__session",
        "__client_uat",
        "__clerk_db_jwt",
      ]) {
        res.cookies.set(cookieName, "", {
          maxAge: 0,
          path: "/",
          domain: "app.gatectr.com",
        });
        res.cookies.set(cookieName, "", {
          maxAge: 0,
          path: "/",
          domain: ".gatectr.com",
        });
      }
      return secure(res);
    }

    const { userId, sessionClaims } = await auth();
    const localeMatch = pathname.match(/^\/fr(\/|$)/);
    const locale = localeMatch ? "fr" : routing.defaultLocale;

    // Waitlist redirect
    const waitlistEnabled = process.env.ENABLE_WAITLIST === "true";
    if (waitlistEnabled && pathname.includes("/sign-up")) {
      const waitlistPath = locale === "fr" ? "/fr/waitlist" : "/waitlist";
      return secure(NextResponse.redirect(new URL(waitlistPath, req.url)));
    }

    // API routes
    if (pathname.startsWith("/api")) {
      if (pathname.startsWith("/api/webhooks/")) return NextResponse.next();
      if (!isPublicRoute(req) && !userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.next();
    }

    // Auth pages — redirect authenticated users to dashboard
    const isSsoCallback = pathname.includes("/sso-callback");
    const isClerkHandshake =
      req.nextUrl.searchParams.has("__clerk_handshake") ||
      req.nextUrl.searchParams.has("__clerk_hs_reason") ||
      req.headers.get("x-clerk-auth-status") === "handshake";
    if (
      userId &&
      !isSsoCallback &&
      !isClerkHandshake &&
      (pathname.includes("/sign-in") || pathname.includes("/sign-up"))
    ) {
      const dashboardPath = locale === "fr" ? "/fr/dashboard" : "/dashboard";
      return secure(NextResponse.redirect(new URL(dashboardPath, req.url)));
    }

    // Unauthenticated protection
    if (!isPublicRoute(req) && !userId) {
      const signInPath = locale === "fr" ? "/fr/sign-in" : "/sign-in";
      if (pathname.includes("/sign-in") || pathname.includes("/sign-up")) {
        return secure(intlMiddleware(req));
      }
      const signInUrl = new URL(signInPath, req.url);
      if (!isOnboardingRoute(req)) {
        const safeRedirect = sanitizeRedirectUrl(pathname, req.url);
        if (safeRedirect)
          signInUrl.searchParams.set("redirect_url", safeRedirect);
      }
      return secure(NextResponse.redirect(signInUrl));
    }

    // Onboarding gate
    const isAuthPage =
      pathname.includes("/sign-in") || pathname.includes("/sign-up");
    if (!isAuthPage && !isClerkHandshake) {
      if (!userId && isOnboardingRoute(req)) {
        const signInPath = locale === "fr" ? "/fr/sign-in" : "/sign-in";
        return secure(NextResponse.redirect(new URL(signInPath, req.url)));
      }
      if (userId) {
        const meta = (sessionClaims?.metadata ??
          sessionClaims?.publicMetadata) as Record<string, unknown> | undefined;
        const onboardingMeta = meta?.onboardingComplete;
        const onboardingDone = onboardingMeta === true;
        const hasRole = !!meta?.role;
        const jwtTemplateConfigured = meta !== undefined;
        const onboardingNotDone =
          jwtTemplateConfigured &&
          (onboardingMeta === false ||
            (onboardingMeta === undefined && !hasRole));

        if (onboardingDone && isOnboardingRoute(req)) {
          const dashboardPath =
            locale === "fr" ? "/fr/dashboard" : "/dashboard";
          return secure(NextResponse.redirect(new URL(dashboardPath, req.url)));
        }
        if (
          onboardingNotDone &&
          !isOnboardingRoute(req) &&
          !isPublicRoute(req)
        ) {
          const onboardingPath =
            locale === "fr" ? "/fr/onboarding" : "/onboarding";
          return secure(
            NextResponse.redirect(new URL(onboardingPath, req.url)),
          );
        }
      }
    }

    // Admin RBAC
    if (isAdminRoute(req) && userId) {
      const meta = (sessionClaims?.metadata ??
        sessionClaims?.publicMetadata) as Record<string, unknown> | undefined;
      const role = meta?.role as RoleName | undefined;
      const ADMIN_ROLES: RoleName[] = [
        "SUPER_ADMIN",
        "ADMIN",
        "MANAGER",
        "SUPPORT",
      ];
      const hasAccess = role ? ADMIN_ROLES.includes(role) : false;
      if (!hasAccess) {
        fetch(new URL("/api/audit", req.url), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret":
              process.env.INTERNAL_AUDIT_SECRET ?? "dev-audit-secret",
          },
          body: JSON.stringify({
            resource: pathname,
            action: "access.denied",
            success: false,
            ipAddress:
              req.headers.get("x-forwarded-for") ??
              req.headers.get("x-real-ip") ??
              undefined,
            userAgent: req.headers.get("user-agent") ?? undefined,
          }),
        }).catch((err) => console.error("[middleware] audit log failed:", err));

        const dashboardPath = locale === "fr" ? "/fr/dashboard" : "/dashboard";
        const dashboardUrl = new URL(dashboardPath, req.url);
        dashboardUrl.searchParams.set("error", "access_denied");
        return secure(NextResponse.redirect(dashboardUrl));
      }
    }

    return secure(intlMiddleware(req));
  },
  { clockSkewInMs: 30_000 },
);

// Use full Clerk middleware when Clerk keys are available, simple dev middleware otherwise
export default process.env.CLERK_SECRET_KEY ? prodMiddleware : devMiddleware;

export const config = {
  matcher: [
    "/((?!_next|_vercel|opengraph-image|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)",
    "/(api|trpc|__clerk)(.*)",
  ],
};
