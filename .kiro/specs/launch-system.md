# Launch System — Complete Spec

## Context

GateCtr is launching on Product Hunt. The current system can send launch emails to all users and has a `/launch` marketing page. This spec covers the 3 phases needed to make the launch system production-grade.

## Current State

- ✅ Mass email admin (`/admin/mass-email`) — sends bilingual launch email to all active users
- ✅ Launch marketing page (`/launch`) — hero, promo code, features, PH CTA
- ✅ `?ref=producthunt` captured at signup → stored in `user.metadata.ref`
- ✅ Email template `launch-announcement.tsx` — React Email, bilingual, promo code
- ❌ No referral analytics
- ❌ No promo code tracking
- ❌ No conversion funnel visibility
- ❌ No milestone notifications
- ❌ No email engagement metrics in admin

---

## Phase 1 — Launch Day (Day 0)

### 1.1 Referral Sources Widget (Admin Overview)

**Goal:** See in real-time how many signups come from Product Hunt vs other sources.

**Implementation:**

- Add a new server action `getReferralStats()` in `lib/actions/launch.ts`
- Query `User.metadata` for `ref` field, group by source, count signups
- Add `ReferralSourcesWidget` component in `components/admin/overview/`
- Inject into `app/[locale]/(admin)/admin/overview/page.tsx`

**Data shape:**

```ts
interface ReferralStat {
  source: string; // "producthunt", "twitter", "direct", etc.
  count: number;
  percentage: number;
  last24h: number; // signups in last 24h from this source
}
```

**UI:** Card with table — source | count | % | last 24h. Sorted by count desc.

---

### 1.2 Email Engagement Metrics in Admin

**Goal:** See sent/opened/clicked/bounced for the launch email campaign.

**Implementation:**

- Add `getEmailCampaignStats(template: string)` server action
- Query `EmailLog` where `template = "launch-announcement"`
- Aggregate: total sent, opened (openedAt not null), clicked (clickedAt not null), bounced
- Add `EmailCampaignStats` card in the mass-email admin page

**Data shape:**

```ts
interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number;
  clickRate: number;
}
```

**UI:** 4 KPI cards (sent, open rate, click rate, bounce rate) above the recipient table.

---

### 1.3 Milestone Slack Notifications

**Goal:** Get notified in Slack when PH signups hit 10, 50, 100, 500, 1000.

**Implementation:**

- Add `checkAndNotifyMilestone(source: string)` in `lib/actions/launch.ts`
- Called from `app/api/webhooks/clerk/route.ts` after `user.created` when `ref === "producthunt"`
- Milestones: [10, 50, 100, 250, 500, 1000]
- Store last notified milestone in Redis key `launch:milestone:producthunt`
- Send Slack webhook if new milestone crossed

**Slack message format:**

```
🚀 GateCtr — {count} signups from Product Hunt!
Milestone: {milestone} reached at {time}
Total users: {totalUsers}
```

**Env var needed:** `SLACK_LAUNCH_WEBHOOK_URL`

---

### 1.4 Promo Code Redemption Tracking

**Goal:** Know how many users actually used `PRODUCTHUNT26`.

**Implementation:**

- In `app/api/webhooks/stripe/route.ts`, handle `customer.subscription.created`
- Check if subscription was created with coupon `PRODUCTHUNT26`
- Log to `EmailLog` with `template = "promo-redemption"` and `status = "REDEEMED"`
- Or add a dedicated `PromoRedemption` table (simpler: use existing `EmailLog`)

**Stripe webhook event:** `customer.subscription.created` → `discount.coupon.id === "PRODUCTHUNT26"`

**Admin display:** Add "Promo redemptions" counter to mass-email page header.

---

## Phase 2 — Post-Launch (Week 1)

### 2.1 Referral Analytics Page

**Goal:** Full conversion funnel by acquisition source.

**Route:** `/admin/launch` (new admin page)

**Sections:**

1. **Funnel by source** — for each ref source: signups → onboarding completed → first API call → plan upgrade
2. **Time series** — signups per hour/day since launch, colored by source
3. **Email campaign** — sent/opened/clicked/bounced with time series
4. **Promo code** — redemptions count, revenue attributed

**Implementation:**

- New page `app/[locale]/(admin)/admin/launch/page.tsx`
- Server actions in `lib/actions/launch.ts`
- Charts using Recharts (already in project)
- Add "Launch" to admin sidebar in `messages/en/admin-shared.json`

**Data queries:**

```ts
// Funnel step 1: signups by source
prisma.user.groupBy({ by: ['metadata'], ... })

// Funnel step 2: onboarding completed
prisma.user.count({ where: { metadata: { path: ['onboardingComplete'], equals: true }, ... } })

// Funnel step 3: first API call
prisma.usageLog.groupBy({ by: ['userId'], ... })

// Funnel step 4: plan upgrade
prisma.subscription.count({ where: { plan: { name: { not: 'FREE' } }, ... } })
```

---

### 2.2 Cohort Analysis

**Goal:** Retention by acquisition channel — do PH users stay?

**Implementation:**

- Weekly cohort table: users who signed up week N, % still active week N+1, N+2, N+4
- Grouped by `user.metadata.ref`
- "Active" = has at least 1 `UsageLog` in the period

**UI:** Cohort table (rows = signup week, columns = weeks since signup, cells = retention %)

---

### 2.3 Promo Code Expiration Enforcement

**Goal:** `PRODUCTHUNT26` should only work for 48h after launch.

**Implementation:**

- Store launch date in env var `LAUNCH_DATE="2026-04-15T00:00:00Z"`
- In Stripe coupon config: set `redeem_by` to `LAUNCH_DATE + 48h`
- Or: validate in `app/api/billing/checkout/route.ts` — reject coupon if `Date.now() > LAUNCH_DATE + 48h`
- Show "Offer expired" message on `/launch` page after deadline

---

### 2.4 Referral Reward System (Optional)

**Goal:** Incentivize users to refer others.

**Implementation:**

- Add `referredBy` field to `User` model (Prisma migration)
- Capture `?referral=<userId>` at signup → store in `user.metadata.referredBy`
- When referred user upgrades to Pro: give referrer 1 month free (Stripe credit)
- Admin page to view referral tree and rewards issued

**Schema addition:**

```prisma
model User {
  // ... existing fields
  referredBy String? // userId of referrer
  referrals  User[]  @relation("referrals")
}
```

---

## Phase 3 — Growth (Month 1+)

### 3.1 UTM Parameter Tracking

**Goal:** Full campaign attribution (utm_source, utm_medium, utm_campaign, utm_content).

**Implementation:**

- Capture UTM params at first page load → store in cookie `gatectr_utm`
- On signup: read cookie → store in `user.metadata.utm`
- Admin analytics: breakdown by utm_source, utm_campaign

**Cookie schema:**

```ts
interface UTMData {
  source?: string; // "producthunt", "twitter", "newsletter"
  medium?: string; // "social", "email", "cpc"
  campaign?: string; // "ph-launch-2026", "beta-invite"
  content?: string; // "hero-cta", "email-footer"
  capturedAt: string; // ISO timestamp
  landingPage: string; // "/launch", "/features"
}
```

**Implementation files:**

- `components/marketing/utm-capture.tsx` — client component, reads URL params, sets cookie
- Add to `app/[locale]/(marketing)/layout.tsx`
- `app/api/webhooks/clerk/route.ts` — read cookie from request headers on `user.created`

---

### 3.2 A/B Testing for Email Campaigns

**Goal:** Test different subject lines and CTAs for future email campaigns.

**Implementation:**

- Add `variant` field to `EmailLog` (A or B)
- Split recipients 50/50 at send time
- Track open/click rates per variant
- Admin UI to compare variants

**Schema addition:**

```prisma
model EmailLog {
  // ... existing fields
  variant String? // "A" | "B" for A/B tests
}
```

---

### 3.3 BI Tool Integration

**Goal:** Export launch data to Metabase/Tableau for deeper analysis.

**Implementation:**

- Add `GET /api/admin/launch/export` endpoint
- Returns CSV: userId, email, plan, ref, signupDate, onboardingDate, firstApiCallDate, upgradeDate, upgradeRevenue
- Protected by `analytics:read` permission
- Add "Export CSV" button to `/admin/launch` page

---

### 3.4 Real-time Launch Dashboard (WebSocket)

**Goal:** Live counter of signups during launch day.

**Implementation:**

- Use Upstash Redis pub/sub (already in project)
- Publish `launch:signup` event on each new user from PH
- Admin page `/admin/launch` subscribes via SSE (`/api/admin/launch/stream`)
- Live counter with animation

**API route:** `app/api/admin/launch/stream/route.ts` — Server-Sent Events

---

## Files to Create/Modify

### New files

```
lib/actions/launch.ts                           # All launch server actions
app/[locale]/(admin)/admin/launch/page.tsx      # Launch analytics page
components/admin/launch/referral-sources.tsx    # Referral sources widget
components/admin/launch/campaign-stats.tsx      # Email campaign KPIs
components/admin/launch/funnel-chart.tsx        # Conversion funnel
components/admin/launch/cohort-table.tsx        # Cohort retention table
components/marketing/utm-capture.tsx            # UTM cookie capture
app/api/admin/launch/export/route.ts            # CSV export
app/api/admin/launch/stream/route.ts            # SSE for live counter
```

### Modified files

```
app/[locale]/(admin)/admin/overview/page.tsx    # Add referral widget
app/[locale]/(admin)/admin/mass-email/page.tsx  # Add campaign stats
app/api/webhooks/clerk/route.ts                 # Add milestone check + UTM capture
app/api/webhooks/stripe/route.ts                # Add promo redemption tracking
messages/en/admin-shared.json                   # Add "launch" sidebar entry
messages/fr/admin-shared.json                   # Add "launch" sidebar entry
prisma/schema.prisma                            # Add referredBy, variant fields
```

### Env vars needed

```
SLACK_LAUNCH_WEBHOOK_URL=https://hooks.slack.com/services/xxx
LAUNCH_DATE=2026-04-15T00:00:00Z
PH_COUPON_ID=PRODUCTHUNT26
```

---

## Priority Matrix

| Feature                       | Phase | Effort | Impact | Do before launch? |
| ----------------------------- | ----- | ------ | ------ | ----------------- |
| Referral sources widget       | 1     | Low    | High   | ✅ Yes            |
| Email campaign stats          | 1     | Low    | High   | ✅ Yes            |
| Slack milestone notifications | 1     | Low    | Medium | ✅ Yes            |
| Promo code tracking           | 1     | Medium | Medium | ✅ Yes            |
| Launch analytics page         | 2     | High   | High   | After launch      |
| Cohort analysis               | 2     | High   | Medium | After launch      |
| Promo expiration              | 2     | Low    | Low    | After launch      |
| Referral rewards              | 2     | High   | Medium | After launch      |
| UTM tracking                  | 3     | Medium | High   | After launch      |
| A/B email testing             | 3     | High   | Medium | After launch      |
| BI export                     | 3     | Low    | Medium | After launch      |
| Live dashboard                | 3     | High   | Low    | After launch      |
