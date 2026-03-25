---
inclusion: manual
---

# Clerk Pro Migration Plan

## Current state (Free plan)

Clerk free plan does not support shared cookies across subdomains.
As a result, `ClerkProvider` is scoped to app route groups only — it is never loaded on `gatectr.com`.

### Architecture

```
gatectr.com          → marketing only, NO Clerk, NO auth
app.gatectr.com      → ClerkProvider in each app route group layout
status.gatectr.com   → no auth, root rewrite to /en/status
api.gatectr.com      → API proxy, no Clerk
```

### Where ClerkProvider lives

| File | Reason |
|------|--------|
| `app/[locale]/(dashboard)/layout.tsx` | Dashboard — authenticated users |
| `app/[locale]/(auth)/layout.tsx` | Sign-in / sign-up pages |
| `app/[locale]/(admin)/layout.tsx` | Admin panel — RBAC protected |
| `app/[locale]/onboarding/layout.tsx` | Onboarding flow |

`app/layout.tsx` — NO ClerkProvider. Marketing pages load without Clerk.

### Middleware (proxy.ts)

`gatectr.com` exits the `clerkMiddleware` callback before `auth()` is called.
This prevents `client-uat-but-no-session-token` errors caused by Clerk
attempting a handshake on a domain with no session cookie.

---

## Upgrading to Clerk Pro

Clerk Pro unlocks `allowedRedirectOrigins` and shared cookie domain (`.gatectr.com`).
This enables a single `ClerkProvider` at the root layout and removes the per-group duplication.

### Step 1 — Enable shared cookie domain in Clerk Dashboard

1. Clerk Dashboard → **Domains** → add `gatectr.com` as a satellite domain
2. Set cookie domain to `.gatectr.com` (note the leading dot — covers all subdomains)
3. Verify `app.gatectr.com` is the primary domain

### Step 2 — Update `components/clerk-provider.tsx`

Re-add the `domain` prop, but use the env var instead of `window.location`:

```tsx
<ClerkNextJSProvider
  domain={process.env.NEXT_PUBLIC_CLERK_DOMAIN ?? ".gatectr.com"}
  // ... rest of props
>
```

Add to `.env`:
```
NEXT_PUBLIC_CLERK_DOMAIN=.gatectr.com
```

### Step 3 — Move ClerkProvider back to root layout

```tsx
// app/layout.tsx
import { ClerkProvider } from "@/components/clerk-provider";

export default async function RootLayout({ children }) {
  // ... locale detection ...
  return (
    <html lang={locale}>
      <body>
        <ThemeProvider ...>
          <ClerkProvider locale={locale}>
            <ReactQueryProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </ReactQueryProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Step 4 — Remove ClerkProvider from route group layouts

Remove the `ClerkProvider` import and wrapper from:
- `app/[locale]/(dashboard)/layout.tsx`
- `app/[locale]/(auth)/layout.tsx`
- `app/[locale]/(admin)/layout.tsx`
- `app/[locale]/onboarding/layout.tsx`

### Step 5 — Update proxy.ts middleware

Remove the early-exit block for `gatectr.com` — Clerk can now run on all domains:

```ts
// DELETE this entire block:
// ── Marketing domain — bypass Clerk entirely ──
if (!isAppSubdomain && !isDev) {
  // ...
}
```

Restore the original `auth()` call at the top of the middleware callback and
re-add the marketing domain redirect logic inside the Clerk context:

```ts
// gatectr.com (marketing) → redirect app routes to app.gatectr.com
if (!isAppSubdomain) {
  const appRoutes = ["/dashboard", "/onboarding", "/admin", "/sign-in", "/sign-up", ...];
  if (appRoutes.some((r) => pathname.startsWith(r))) {
    return secure(NextResponse.redirect(new URL(pathname, appBase)));
  }
}
```

### Step 6 — Update Clerk redirect URLs

In Clerk Dashboard → **Paths**:
- Sign-in URL: `https://app.gatectr.com/sign-in`
- Sign-up URL: `https://app.gatectr.com/sign-up`
- After sign-in: `https://app.gatectr.com/dashboard`
- After sign-up: `https://app.gatectr.com/onboarding`
- After sign-out: `https://app.gatectr.com/sign-in`

### Step 7 — Test

- [ ] `gatectr.com` loads without Clerk handshake in network tab
- [ ] `app.gatectr.com/sign-in` works and redirects to dashboard
- [ ] Authenticated user on `gatectr.com` sees marketing (no redirect loop)
- [ ] Sign-out from `app.gatectr.com` clears session on both domains
- [ ] `status.gatectr.com` unaffected

---

## Files changed summary

| File | Free plan | Pro plan |
|------|-----------|----------|
| `app/layout.tsx` | No ClerkProvider | ClerkProvider here |
| `app/[locale]/(dashboard)/layout.tsx` | ClerkProvider | Remove it |
| `app/[locale]/(auth)/layout.tsx` | ClerkProvider | Remove it |
| `app/[locale]/(admin)/layout.tsx` | ClerkProvider | Remove it |
| `app/[locale]/onboarding/layout.tsx` | ClerkProvider | Remove it |
| `components/clerk-provider.tsx` | No `domain` prop | Add `domain` prop |
| `proxy.ts` | Early exit for gatectr.com | Remove early exit |
