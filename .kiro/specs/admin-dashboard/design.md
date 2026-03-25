# Design Document: Admin Dashboard

## Overview

This document covers the design for completing GateCtr's admin control plane. The existing admin area has a working layout, sidebar, RBAC guard, user management, waitlist management, billing, and partial audit logs. This design fills the gaps: enhancing the overview page with platform KPIs, completing audit log filters, and building five new pages — feature flags, system health, teams management, platform analytics, and admin notifications/alerts.

The admin area lives at `app/[locale]/(admin)/admin/` and is protected by `requireAdmin()` at the layout level. All new pages follow the same patterns as existing ones: server components for data fetching, client components for interactivity, TanStack Query for client-side polling, Zustand for cross-component state, and `next-intl` for i18n.

---

## Architecture

### Data Flow Strategy

Each page uses one of three data-fetching patterns depending on freshness requirements:

1. **Server-side fetch (RSC)** — used for initial page load data that doesn't need real-time updates. The page component fetches directly via Prisma and passes data as props to client components. Used by: feature flags, teams, audit logs.

2. **TanStack Query (client polling)** — used for data that must auto-refresh. The page renders a client shell that fetches via API routes. Used by: system health (30s interval), notifications badge count.

3. **Server Actions** — used for all mutations (toggle flag, acknowledge alert, remove member, etc.). Actions call `requirePermission()` before any DB write, then call `logAudit()` as a fire-and-forget side effect.

### RBAC Enforcement

Every server action and API route follows this guard pattern:

```
requireAdmin()          → layout-level, blocks non-admin roles
requirePermission(p)    → action/route-level, checks specific permission
```

Permission matrix for new pages:

| Page | Read permission | Write permission |
|---|---|---|
| Overview | `analytics:read` | — |
| Audit Logs | `audit:read` | — |
| Feature Flags | `system:read` | `system:write` |
| System Health | `system:read` | — |
| Teams | `users:read` | `users:write` / `users:delete` |
| Analytics | `analytics:read` | — |
| Notifications | `analytics:read` | `analytics:write` |

### Redis Cache Invalidation

Feature flag toggles must invalidate cached flag state. The pattern used throughout the codebase is a direct Redis `del` or `set` call via `lib/redis.ts`. Flag cache keys follow the pattern `feature_flag:{userId}:{flagKey}`.

---

## Components and Interfaces

### New Page Routes

```
app/[locale]/(admin)/admin/
├── overview/page.tsx              ← enhanced (add KPI widgets + health summary)
├── audit-logs/page.tsx            ← enhanced (add date range, actor, action filters)
├── feature-flags/
│   └── page.tsx                   ← new
├── system/
│   └── page.tsx                   ← new
├── teams/
│   ├── page.tsx                   ← new (list)
│   └── [teamId]/
│       └── page.tsx               ← new (detail)
├── analytics/
│   └── page.tsx                   ← new
└── notifications/
    └── page.tsx                   ← new
```

### New API Routes

```
app/api/admin/
├── overview/route.ts              ← GET: KPI stats (users, MRR, tokens, subscriptions)
├── audit-logs/route.ts            ← GET: enhanced with date range, actor, action filters (existing, extended)
├── feature-flags/
│   ├── route.ts                   ← GET: list all flags with override counts
│   └── [id]/
│       ├── route.ts               ← PATCH: toggle, rollout, plans
│       └── overrides/
│           └── route.ts           ← GET/POST/DELETE: per-user overrides
├── system/
│   ├── stats/route.ts             ← GET: API requests, latency, error rate, cache hit rate
│   └── history/route.ts           ← GET: 24h health history per service
├── teams/
│   ├── route.ts                   ← GET: paginated team list
│   └── [teamId]/
│       ├── route.ts               ← GET: team detail, DELETE: delete team
│       ├── members/
│       │   └── [memberId]/route.ts ← DELETE: remove member
│       └── invitations/
│           └── [invitationId]/route.ts ← DELETE: revoke invitation
├── analytics/
│   └── route.ts                   ← GET: platform-wide token analytics
└── notifications/
    └── route.ts                   ← GET: alert list, PATCH: acknowledge, POST: acknowledge-all
```

### Sidebar Updates

Two new nav items added to `NAV_GROUPS` in `components/admin/sidebar.tsx`:

```typescript
// groups.users group — add Teams
{ key: "sidebar.teams", href: "/admin/teams", permission: "users:read", icon: Building2 }

// groups.platform group — add Analytics + Notifications
{ key: "sidebar.analytics", href: "/admin/analytics", permission: "analytics:read", icon: BarChart3 }
{ key: "sidebar.notifications", href: "/admin/notifications", permission: "analytics:read", icon: Bell, badge: unacknowledgedCount }
```

The unacknowledged alert count badge is fetched client-side via TanStack Query with a 60s interval and stored in a Zustand slice so the sidebar and the notifications page share the same value without double-fetching.

---

## Components Per Page

### 1. Overview Page (enhanced)

New components added alongside the existing waitlist card:

- `KpiGrid` — 4-column grid of `KpiCard` widgets (total users, active subscriptions, MRR, tokens this month). Each card accepts a `value`, `label`, `trend` (delta vs last month), and `isLoading` prop. Skeleton rendered when `isLoading`.
- `SystemHealthSummary` — compact widget showing overall status badge + per-service dot indicators. Links to `/admin/system`.
- `SignupTrendChart` — Recharts `AreaChart` of 7-day new user signups. Data fetched server-side.
- `PlanDistributionChart` — Recharts `PieChart` of user count per plan (Free/Pro/Team/Enterprise).

Data fetching: all four KPI values fetched in a single `GET /api/admin/overview` call from the page RSC. Health summary fetched from the existing `GET /api/v1/system/health`. Both are parallel `Promise.all` calls.

### 2. Audit Logs Page (enhanced)

The existing `AuditFilters` client component gains three new filter inputs:

- Date range picker (from/to) using a Radix UI Popover + two `<input type="date">` fields
- Actor email search input (separate from the existing user email search)
- Action keyword search input

The `fetchLogs` server function gains corresponding `where` clauses:
- `createdAt: { gte: from, lte: to }` for date range
- `actorId` resolved via a subquery on `User.email` for actor filter
- `action: { contains: keyword, mode: 'insensitive' }` for action filter

URL search params updated: `from`, `to`, `actor`, `action` added alongside existing `page`, `resource`, `status`, `search`.

### 3. Feature Flags Page

- `FeatureFlagsTable` (client) — TanStack Table with columns: key, name, description, enabled toggle, rollout slider, enabled plans badges, override count. Inline editing via optimistic updates.
- `FlagOverridesSheet` — Radix Sheet that opens when clicking override count. Lists existing overrides with remove button. Has a "Add override" form (user email search + enabled/disabled select).
- `RolloutInput` — controlled number input with validation (0–100 integer). Shows error state for out-of-range values.

Mutations use server actions in `app/[locale]/(admin)/admin/feature-flags/_actions.ts`:
- `toggleFlag(id, enabled)` — updates DB + invalidates Redis cache keys for all users with that flag
- `updateRollout(id, pct)` — validates 0–100, updates DB
- `updateEnabledPlans(id, plans)` — updates DB
- `addOverride(flagId, userEmail, enabled)` — resolves user by email, creates `FeatureFlagOverride`
- `removeOverride(overrideId)` — deletes record

### 4. System Health Page

- `ServiceStatusTable` — table of 5 services with status badge (color-coded), latency in ms, last checked timestamp. Rows with DEGRADED/DOWN highlighted with `bg-warning/10` or `bg-destructive/10`.
- `OverallStatusBanner` — top-of-page banner showing computed overall status.
- `ServiceSparkline` — per-service 24h status timeline rendered as a row of colored segments (green/yellow/red) using SVG. Data from `GET /api/admin/system/history`.
- `PlatformStatsGrid` — 4 stat cards: total API requests (24h), p50/p95 latency, error rate %, cache hit rate %.

Auto-refresh: the entire page is a client component that uses `useQuery` with `refetchInterval: 30_000`. On fetch error, shows last known data with a "Last updated X ago" timestamp and a "Status unavailable" banner.

### 5. Teams Management Page

List page (`/admin/teams`):
- `TeamsTable` (client) — TanStack Table with server-side pagination. Columns: team name, slug, owner email, member count, plan badge, project count, created date. Debounced search input (300ms) updates URL params.
- Clicking a row navigates to `/admin/teams/[teamId]`.

Detail page (`/admin/teams/[teamId]`):
- `TeamMetaCard` — name, slug, description, owner info, created date.
- `TeamMembersTable` — member list with role badge and "Remove" button (requires `users:write`).
- `TeamInvitationsTable` — pending invitations with expiry and "Revoke" button (requires `users:write`).
- `TeamProjectsList` — list of associated projects (read-only).
- `DeleteTeamButton` — danger button that opens a confirmation dialog. Requires `users:delete`. On confirm, calls `DELETE /api/admin/teams/[teamId]` then redirects to `/admin/teams`.

### 6. Platform Analytics Page

- `AnalyticsDateRangePicker` — segmented control: 7d / 30d / 90d. Updates URL param `range`. All charts re-fetch on change.
- `TokenKpiRow` — 3 stat cards: current period total tokens, previous period total, percentage change (with up/down arrow).
- `DailyTokenTrendChart` — Recharts `AreaChart` of daily token usage for the selected range.
- `ProviderBreakdownChart` — Recharts `BarChart` of token usage by provider (OpenAI, Anthropic, Mistral, Gemini).
- `ModelBreakdownTable` — top 10 models by token usage, with model name, provider, token count, and % of total.
- `ActiveUsersKpi` — DAU and MAU stat cards.
- `TopUsersTable` — top 10 users by token consumption: avatar, name, email, plan badge, token count.
- `ExportButton` — triggers `GET /api/admin/analytics?export=csv&range=30d`.

All chart data fetched from `GET /api/admin/analytics?range=30d` which returns a single JSON payload with all analytics data to minimize round trips.

### 7. Notifications / Alerts Page

- `UnacknowledgedAlertsList` — sorted list of unacknowledged alerts with severity badge (critical=red, warning=amber, info=blue), message, rule name, and "Acknowledge" button per row.
- `AcknowledgeAllButton` — bulk action button. Shows confirmation count in a toast on success.
- `AlertHistoryTable` — TanStack Table of last 100 alerts. Columns: severity, message, rule name, created at, acknowledged state. Filterable by severity and acknowledged state via URL params.
- `SeverityFilter` — segmented control: all / critical / warning / info.
- `AcknowledgedFilter` — segmented control: all / unacknowledged / acknowledged.

Mutations via server actions in `_actions.ts`:
- `acknowledgeAlert(id)` — sets `acknowledged`, `acknowledgedAt`, `acknowledgedBy` (current user's DB id)
- `acknowledgeAllAlerts()` — bulk update, returns count

---

## Data Models

All models already exist in `prisma/schema.prisma`. No migrations needed. Key queries per page:

### Overview KPIs

```typescript
// Single parallel fetch
const [userCount, activeSubCount, mrrCents, tokenSum] = await Promise.all([
  prisma.user.count({ where: { isActive: true } }),
  prisma.subscription.count({ where: { status: 'ACTIVE' } }),
  // MRR: sum of plan prices for active subscriptions — joined via Plan.stripePriceIdMonthly
  // Approximated from plan counts × plan price constants from config/product.ts
  prisma.subscription.groupBy({ by: ['planId'], where: { status: 'ACTIVE' }, _count: true }),
  prisma.usageLog.aggregate({
    _sum: { totalTokens: true },
    where: { createdAt: { gte: startOfMonth } }
  })
])
```

### Signup Trend (7-day)

```sql
SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*) AS count
FROM users
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY day ORDER BY day ASC
```

Gaps filled in application code to always return exactly 7 data points.

### Feature Flags List

```typescript
prisma.featureFlag.findMany({
  include: { _count: { select: { overrides: true } } },
  orderBy: { key: 'asc' }
})
```

### System Health History (24h)

```typescript
prisma.systemHealth.findMany({
  where: { checkedAt: { gte: new Date(Date.now() - 86_400_000) } },
  orderBy: { checkedAt: 'asc' }
})
// Grouped by service in application code
```

### Teams List

```typescript
prisma.team.findMany({
  skip, take,
  where: search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { owner: { email: { contains: search, mode: 'insensitive' } } }
    ]
  } : undefined,
  include: {
    owner: { select: { email: true, plan: true } },
    _count: { select: { members: true, projects: true } }
  },
  orderBy: { createdAt: 'desc' }
})
```

### Platform Analytics

```typescript
// Daily token trend
prisma.$queryRaw<{ day: string; tokens: bigint }[]>`
  SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
         SUM("totalTokens") AS tokens
  FROM usage_logs
  WHERE "createdAt" >= ${rangeStart}
  GROUP BY day ORDER BY day ASC
`

// Provider breakdown
prisma.usageLog.groupBy({
  by: ['provider'],
  _sum: { totalTokens: true },
  where: { createdAt: { gte: rangeStart } }
})

// Top 10 users
prisma.usageLog.groupBy({
  by: ['userId'],
  _sum: { totalTokens: true },
  where: { createdAt: { gte: rangeStart } },
  orderBy: { _sum: { totalTokens: 'desc' } },
  take: 10
})
```

### Alerts

```typescript
// Unacknowledged, sorted by severity then date
prisma.alert.findMany({
  where: { acknowledged: false },
  include: { rule: { select: { name: true } } },
  orderBy: [
    // Severity sort handled in application code (critical > warning > info)
    { createdAt: 'desc' }
  ]
})
```

Severity sort order applied in application code after fetch:
```typescript
const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 }
alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.createdAt - a.createdAt)
```

---

## i18n Translation File Structure

New translation files (both `messages/en/` and `messages/fr/` required for each):

```
messages/
├── en/
│   ├── admin-overview.json        ← extended (add kpi, health, charts sections)
│   ├── admin-audit-logs.json      ← extended (add dateRange, actor, action filter keys)
│   ├── admin-feature-flags.json   ← new
│   ├── admin-system.json          ← new
│   ├── admin-teams.json           ← new
│   ├── admin-analytics.json       ← new
│   └── admin-notifications.json   ← new
└── fr/
    └── (identical key structure for all above)
```

`i18n/request.ts` updated to import all new namespaces.

`messages/en/admin-shared.json` extended with new sidebar keys:
```json
{
  "sidebar": {
    "teams": "Teams",
    "analytics": "Analytics",
    "notifications": "Notifications"
  },
  "groups": {
    "users": "Users"
  }
}
```

Sample structure for `admin-feature-flags.json`:
```json
{
  "metadata": { "title": "Feature Flags" },
  "title": "Feature Flags",
  "subtitle": "Control feature rollout across plans and users.",
  "table": { "key": "Key", "name": "Name", "enabled": "Enabled", "rollout": "Rollout", "plans": "Plans", "overrides": "Overrides" },
  "rollout": { "label": "Rollout %", "error": "Must be 0–100" },
  "overrides": { "title": "User Overrides", "add": "Add override", "remove": "Remove", "user": "User email", "value": "Value", "enabled": "Enabled", "disabled": "Disabled" },
  "actions": { "toggle": "Toggle flag", "save": "Save changes" },
  "empty": "No feature flags configured.",
  "errors": { "invalidRollout": "Rollout must be an integer between 0 and 100.", "userNotFound": "No user found with that email.", "forbidden": "Insufficient permissions." }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Trend queries return exactly N data points

*For any* date range of N days requested from a trend-fetching function (signup trend, daily token usage), the result should contain exactly N data points — one per calendar day — with zero-filled entries for days with no activity.

**Validates: Requirements 1.3, 9.3**

---

### Property 2: Plan distribution counts sum to total user count

*For any* snapshot of the user table, the sum of per-plan counts returned by the plan distribution query should equal the total user count returned by the KPI query.

**Validates: Requirements 1.4**

---

### Property 3: Search filter — all results match the query

*For any* search query applied to the teams list (or feature flags list), every returned record should contain the query string in at least one of the searchable fields (name, slug, or owner email for teams).

**Validates: Requirements 3.2**

---

### Property 4: Admin write actions are reflected in subsequent reads

*For any* admin write action (remove team member, revoke invitation, delete team, toggle feature flag, update rollout, update enabled plans, add override, remove override, acknowledge alert), a subsequent read of the affected resource should reflect the new state.

**Validates: Requirements 3.4, 3.5, 3.6, 6.2, 6.4, 6.5, 6.6, 10.2**

---

### Property 5: Bulk acknowledge clears all unacknowledged alerts

*For any* set of unacknowledged alerts, after calling the bulk-acknowledge action, a query for unacknowledged alerts should return an empty list.

**Validates: Requirements 10.3**

---

### Property 6: Permission guard returns 403 for unauthorized write actions

*For any* admin write action (users:write, billing:write, system:write) attempted by a user whose role does not include the required permission, the action should return HTTP 403 and leave the resource unchanged.

**Validates: Requirements 3.7, 6.8, 11.1, 11.2**

---

### Property 7: Rollout percentage validation rejects out-of-range values

*For any* integer value outside the range [0, 100], the `updateRollout` action should return a validation error and not update the database. *For any* integer value within [0, 100], the update should succeed.

**Validates: Requirements 6.3**

---

### Property 8: Audit log filter — all returned entries satisfy active filters

*For any* combination of active filters (resource, status, user email, actor email, action keyword, date range), every entry in the returned result set should satisfy all active filter conditions simultaneously.

**Validates: Requirements 7.3, 7.5**

---

### Property 9: Overall health status equals worst individual service status

*For any* set of service statuses, the computed overall platform status should equal the most severe status present (DOWN > DEGRADED > HEALTHY).

**Validates: Requirements 8.2**

---

### Property 10: Token percentage change calculation is correct

*For any* two non-zero token counts (current period C, previous period P), the computed percentage change should equal `((C - P) / P) * 100` rounded to one decimal place.

**Validates: Requirements 9.1**

---

### Property 11: Top-N query returns at most N results sorted descending

*For any* top-users query with limit N, the result should contain at most N entries, and the token counts should be in non-increasing order.

**Validates: Requirements 9.7**

---

### Property 12: Date-range queries return only data within the range

*For any* analytics query with a date range [start, end], every data point in the result should have a `createdAt` timestamp that falls within [start, end] (inclusive).

**Validates: Requirements 9.8**

---

### Property 13: Alert sort order is critical → warning → info → createdAt desc

*For any* list of unacknowledged alerts, after applying the sort function, all critical alerts should appear before all warning alerts, which should appear before all info alerts. Within each severity group, alerts should be ordered by `createdAt` descending.

**Validates: Requirements 10.1**

---

### Property 14: All admin write actions produce an AuditLog entry

*For any* successful admin write action, a corresponding `AuditLog` record should be created with the correct `resource`, `action`, `actorId`, `resourceId`, `oldValue`, `newValue`, and `success: true`.

**Validates: Requirements 11.8**

---

### Property 15: Translation file key structure is identical between en/ and fr/

*For any* translation file in `messages/en/`, the corresponding file in `messages/fr/` should exist and contain an identical top-level and nested key structure (values may differ, keys must not).

**Validates: Requirements 12.5**

---

## Error Handling

### Widget-level isolation (Overview page)

Each KPI widget and chart is wrapped in an independent `ErrorBoundary`. A failed fetch for one widget renders an inline `"Data unavailable"` state without affecting adjacent widgets. The pattern:

```typescript
// Each widget fetches independently via useQuery
// onError: show inline error card, do not throw
```

### Server action errors

All server actions return a typed result union:
```typescript
type ActionResult<T> = { success: true; data: T } | { success: false; error: string; code: 'FORBIDDEN' | 'VALIDATION' | 'NOT_FOUND' | 'INTERNAL' }
```

Client components check `result.success` and display the appropriate error message via `next-intl` translation keys.

### System health fetch failure

When `GET /api/admin/system/health` fails, the system health page shows:
- A `"Status unavailable"` banner at the top
- The last known data (from the previous successful fetch, stored in React state) with a `"Last updated X ago"` timestamp
- The auto-refresh continues attempting every 30 seconds

### 403 handling

API routes return `{ error: 'forbidden', message: '...' }` with HTTP 403. Client components display the `errors.forbidden` translation key in a `toast.error()` call and do not optimistically update the UI.

### Stripe API errors (billing — existing page)

Already handled in the existing billing page. Not redesigned here.

---

## Testing Strategy

### Unit Tests (Vitest)

Focus on pure functions and data-transformation logic:

- `computeOverallStatus(statuses[])` — already exists, extend with edge cases
- `sortAlertsBySeverity(alerts[])` — sort function for Property 13
- `fillTrendGaps(rawData, nDays)` — gap-filling function for Property 1
- `computePctChange(current, previous)` — for Property 10
- `validateRolloutPct(value)` — for Property 7
- Translation file parity check — for Property 15

Avoid writing unit tests for UI rendering or Prisma queries — those are covered by property tests and E2E.

### Property-Based Tests (Vitest + fast-check)

Use `fast-check` (already compatible with Vitest). Minimum 100 iterations per property.

Each test is tagged with a comment referencing the design property:
```typescript
// Feature: admin-dashboard, Property 1: trend queries return exactly N data points
```

**Property 1 — Trend gap filling:**
```typescript
fc.assert(fc.property(
  fc.integer({ min: 1, max: 90 }),
  fc.array(fc.record({ day: fc.string(), count: fc.nat() })),
  (nDays, rawData) => {
    const result = fillTrendGaps(rawData, nDays)
    return result.length === nDays
  }
))
```

**Property 2 — Plan distribution sum:**
```typescript
fc.assert(fc.property(
  fc.array(fc.constantFrom('FREE', 'PRO', 'TEAM', 'ENTERPRISE')),
  (plans) => {
    const dist = computePlanDistribution(plans)
    return Object.values(dist).reduce((a, b) => a + b, 0) === plans.length
  }
))
```

**Property 7 — Rollout validation:**
```typescript
fc.assert(fc.property(fc.integer(), (n) => {
  const result = validateRolloutPct(n)
  if (n >= 0 && n <= 100) return result.valid === true
  return result.valid === false
}))
```

**Property 9 — Overall health status:**
```typescript
fc.assert(fc.property(
  fc.array(fc.constantFrom('HEALTHY', 'DEGRADED', 'DOWN'), { minLength: 1 }),
  (statuses) => {
    const overall = computeOverallStatus(statuses)
    if (statuses.includes('DOWN')) return overall === 'DOWN'
    if (statuses.includes('DEGRADED')) return overall === 'DEGRADED'
    return overall === 'HEALTHY'
  }
))
```

**Property 10 — Percentage change:**
```typescript
fc.assert(fc.property(
  fc.float({ min: 0.01 }), fc.float({ min: 0.01 }),
  (current, previous) => {
    const pct = computePctChange(current, previous)
    return Math.abs(pct - ((current - previous) / previous * 100)) < 0.1
  }
))
```

**Property 11 — Top-N sort:**
```typescript
fc.assert(fc.property(
  fc.array(fc.record({ userId: fc.string(), tokens: fc.nat() })),
  fc.integer({ min: 1, max: 20 }),
  (users, n) => {
    const result = topN(users, n)
    if (result.length > n) return false
    for (let i = 1; i < result.length; i++) {
      if (result[i].tokens > result[i-1].tokens) return false
    }
    return true
  }
))
```

**Property 13 — Alert sort order:**
```typescript
fc.assert(fc.property(
  fc.array(fc.record({
    severity: fc.constantFrom('critical', 'warning', 'info'),
    createdAt: fc.date()
  })),
  (alerts) => {
    const sorted = sortAlertsBySeverity(alerts)
    const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 }
    for (let i = 1; i < sorted.length; i++) {
      const prev = SEVERITY_ORDER[sorted[i-1].severity]
      const curr = SEVERITY_ORDER[sorted[i].severity]
      if (curr < prev) return false
      if (curr === prev && sorted[i].createdAt > sorted[i-1].createdAt) return false
    }
    return true
  }
))
```

**Property 15 — Translation parity:**
```typescript
// Feature: admin-dashboard, Property 15: translation file key structure is identical between en/ and fr/
fc.assert(fc.property(
  fc.constantFrom(...ADMIN_TRANSLATION_FILES),
  (filename) => {
    const en = require(`messages/en/${filename}`)
    const fr = require(`messages/fr/${filename}`)
    return deepKeyStructureEqual(en, fr)
  }
))
```

### E2E Tests (Playwright)

Cover the critical user flows that can't be unit tested:

- Admin can toggle a feature flag and see the change reflected in the table
- Admin can acknowledge all alerts and see the badge count drop to 0
- Admin can filter audit logs by date range and see only matching entries
- Non-admin user is redirected to `/dashboard?error=access_denied` when accessing `/admin/*`
- System health page auto-refreshes (mock 30s timer)
