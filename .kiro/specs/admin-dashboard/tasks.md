# Implementation Plan: Admin Dashboard

## Overview

Complete the GateCtr admin control plane by implementing pure utility functions first, then API routes, then enhanced and new pages, sidebar updates, i18n, and E2E tests. Each task builds on the previous, ending with full integration.

## Tasks

- [x] 1. Implement pure utility functions
  - Create `lib/admin/utils.ts` with all pure data-transformation helpers used across admin pages
  - [x] 1.1 Implement `fillTrendGaps(rawData, nDays)`
    - Accepts an array of `{ day: string; count: number }` and an integer N
    - Returns exactly N entries, one per calendar day, zero-filling missing days
    - _Requirements: 1.3, 9.3_
  - [x] 1.2 Write property test for `fillTrendGaps` (Property 1)
    - **Property 1: Trend queries return exactly N data points**
    - **Validates: Requirements 1.3, 9.3**
  - [x] 1.3 Implement `computePlanDistribution(plans: string[])`
    - Returns `Record<string, number>` counting occurrences per plan value
    - _Requirements: 1.4_
  - [x] 1.4 Write property test for `computePlanDistribution` (Property 2)
    - **Property 2: Plan distribution counts sum to total user count**
    - **Validates: Requirements 1.4**
  - [x] 1.5 Implement `validateRolloutPct(value: number)`
    - Returns `{ valid: true }` for integers in [0, 100], `{ valid: false, error: string }` otherwise
    - _Requirements: 6.3_
  - [x] 1.6 Write property test for `validateRolloutPct` (Property 7)
    - **Property 7: Rollout percentage validation rejects out-of-range values**
    - **Validates: Requirements 6.3**
  - [x] 1.7 Implement `computeOverallStatus(statuses: string[])`
    - Returns `'DOWN'` if any status is `'DOWN'`, `'DEGRADED'` if any is `'DEGRADED'`, else `'HEALTHY'`
    - _Requirements: 8.2_
  - [x] 1.8 Write property test for `computeOverallStatus` (Property 9)
    - **Property 9: Overall health status equals worst individual service status**
    - **Validates: Requirements 8.2**
  - [x] 1.9 Implement `computePctChange(current: number, previous: number)`
    - Returns `((current - previous) / previous) * 100` rounded to one decimal place
    - _Requirements: 9.1_
  - [x] 1.10 Write property test for `computePctChange` (Property 10)
    - **Property 10: Token percentage change calculation is correct**
    - **Validates: Requirements 9.1**
  - [x] 1.11 Implement `topN<T extends { tokens: number }>(items: T[], n: number)`
    - Returns at most N items sorted by `tokens` descending
    - _Requirements: 9.7_
  - [x] 1.12 Write property test for `topN` (Property 11)
    - **Property 11: Top-N query returns at most N results sorted descending**
    - **Validates: Requirements 9.7**
  - [x] 1.13 Implement `sortAlertsBySeverity(alerts)`
    - Sorts by severity order `critical → warning → info`, then by `createdAt` descending within each group
    - _Requirements: 10.1_
  - [x] 1.14 Write property test for `sortAlertsBySeverity` (Property 13)
    - **Property 13: Alert sort order is critical → warning → info → createdAt desc**
    - **Validates: Requirements 10.1**
  - [x] 1.15 Implement `deepKeyStructureEqual(a: object, b: object)`
    - Recursively checks that two objects share identical key structure (values may differ)
    - _Requirements: 12.5_

- [x] 2. Checkpoint — Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement admin API routes — Overview KPIs
  - Create `app/api/admin/overview/route.ts`
  - GET handler: parallel `Promise.all` fetching active user count, active subscription count, MRR (from plan counts × plan price constants in `config/product.ts`), and tokens this month from `usageLog.aggregate`
  - Enforce `requirePermission('analytics:read')` before any DB query
  - Return typed JSON payload; log no audit entry (read-only)
  - _Requirements: 1.1, 11.1, 11.6_

- [x] 4. Implement admin API routes — Feature Flags CRUD
  - [x] 4.1 Create `app/api/admin/feature-flags/route.ts`
    - GET: `prisma.featureFlag.findMany` with `_count: { overrides: true }`, ordered by key
    - Enforce `requirePermission('system:read')`
    - _Requirements: 6.1, 11.4_
  - [x] 4.2 Create `app/api/admin/feature-flags/[id]/route.ts`
    - PATCH: accepts `{ enabled?, rolloutPct?, enabledPlans? }`, validates rollout with `validateRolloutPct`, updates DB, invalidates Redis cache keys (`feature_flag:{userId}:{flagKey}`), calls `logAudit()`
    - Enforce `requirePermission('system:write')`
    - Return typed `ActionResult<FeatureFlag>`
    - _Requirements: 6.2, 6.3, 6.4, 6.7, 11.8_
  - [x] 4.3 Create `app/api/admin/feature-flags/[id]/overrides/route.ts`
    - GET: list overrides for flag; POST: resolve user by email, create `FeatureFlagOverride`; DELETE: remove override by id
    - Enforce `requirePermission('system:write')` on POST/DELETE
    - _Requirements: 6.5, 6.6, 11.8_

- [-] 5. Implement admin API routes — System Health
  - [x] 5.1 Create `app/api/admin/system/stats/route.ts`
    - GET: return total API requests (24h), p50/p95 latency, error rate %, cache hit rate % from `SystemHealth` aggregates
    - Enforce `requirePermission('system:read')`
    - _Requirements: 8.6_
  - [x] 5.2 Create `app/api/admin/system/history/route.ts`
    - GET: `prisma.systemHealth.findMany` for last 24h, ordered by `checkedAt` asc; group by service in application code
    - Enforce `requirePermission('system:read')`
    - _Requirements: 8.4_

- [x] 6. Implement admin API routes — Teams
  - [x] 6.1 Create `app/api/admin/teams/route.ts`
    - GET: paginated team list with `skip`/`take`, optional search across name/slug/owner email, include owner email + plan + member/project counts
    - Enforce `requirePermission('users:read')`
    - _Requirements: 3.1, 3.2_
  - [x] 6.2 Create `app/api/admin/teams/[teamId]/route.ts`
    - GET: full team detail (metadata, owner, members with roles, pending invitations, projects)
    - DELETE: cascade-delete team + members + invitations + projects + API keys, call `logAudit()`
    - Enforce `requirePermission('users:read')` on GET, `requirePermission('users:delete')` on DELETE
    - _Requirements: 3.3, 3.6, 11.8_
  - [x] 6.3 Create `app/api/admin/teams/[teamId]/members/[memberId]/route.ts`
    - DELETE: remove `TeamMember` record, call `logAudit()`
    - Enforce `requirePermission('users:write')`
    - _Requirements: 3.4, 11.8_
  - [x] 6.4 Create `app/api/admin/teams/[teamId]/invitations/[invitationId]/route.ts`
    - DELETE: set `revokedAt` on `TeamInvitation`, call `logAudit()`
    - Enforce `requirePermission('users:write')`
    - _Requirements: 3.5, 11.8_

- [x] 7. Implement admin API routes — Analytics
  - Create `app/api/admin/analytics/route.ts`
  - GET: accepts `range` query param (7d/30d/90d); returns single JSON payload with daily token trend (raw SQL), provider breakdown (`groupBy`), top 10 models, top 10 users, DAU/MAU counts, tokens saved by optimizer
  - Supports `export=csv` query param to stream CSV response
  - Enforce `requirePermission('analytics:read')`
  - _Requirements: 9.1–9.9_

- [x] 8. Implement admin API routes — Notifications/Alerts
  - Create `app/api/admin/notifications/route.ts`
  - GET: unacknowledged alerts (sorted via `sortAlertsBySeverity`) + paginated history (last 100), filterable by severity and acknowledged state via query params
  - PATCH: acknowledge single alert — set `acknowledged`, `acknowledgedAt`, `acknowledgedBy`, call `logAudit()`
  - POST with `{ action: 'acknowledge-all' }`: bulk update all unacknowledged, return count, call `logAudit()`
  - Enforce `requirePermission('analytics:read')` on GET, `requirePermission('analytics:write')` on PATCH/POST
  - _Requirements: 10.1–10.6, 11.8_

- [x] 9. Extend audit logs API route
  - Modify `app/api/admin/audit-logs/route.ts` to add `from`, `to`, `actor`, `action` query params
  - Add `createdAt: { gte: from, lte: to }` where clause for date range
  - Resolve `actor` email to `actorId` via subquery on `User.email`
  - Add `action: { contains: keyword, mode: 'insensitive' }` where clause
  - _Requirements: 7.3, 7.5_

- [ ] 10. Checkpoint — Ensure all API routes compile and return correct shapes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Enhance Overview page with KPI widgets and charts
  - Modify `app/[locale]/(admin)/admin/overview/page.tsx`
  - [x] 11.1 Create `components/admin/overview/kpi-card.tsx`
    - Accepts `value`, `label`, `trend` (delta vs last month), `isLoading`; renders skeleton when loading
    - _Requirements: 1.1, 1.6_
  - [x] 11.2 Create `components/admin/overview/kpi-grid.tsx`
    - 4-column grid rendering four `KpiCard` instances (total users, active subscriptions, MRR, tokens this month)
    - Wraps each card in an independent `ErrorBoundary` for widget-level isolation
    - _Requirements: 1.1, 1.7_
  - [x] 11.3 Create `components/admin/overview/system-health-summary.tsx`
    - Compact widget: overall status badge + per-service dot indicators; links to `/admin/system`
    - Fetches from existing `GET /api/v1/system/health`
    - _Requirements: 1.2_
  - [x] 11.4 Create `components/admin/overview/signup-trend-chart.tsx`
    - Recharts `AreaChart` of 7-day new user signups; data passed as prop from RSC using `fillTrendGaps`
    - _Requirements: 1.3_
  - [x] 11.5 Create `components/admin/overview/plan-distribution-chart.tsx`
    - Recharts `PieChart` of user count per plan using `computePlanDistribution`
    - _Requirements: 1.4_
  - [x] 11.6 Wire all new widgets into `overview/page.tsx`
    - Parallel `Promise.all([fetchOverviewKpis(), fetchSystemHealth()])` in RSC; pass data as props
    - _Requirements: 1.1–1.8_

- [x] 12. Enhance Audit Logs page with new filters
  - Modify `app/[locale]/(admin)/admin/audit-logs/page.tsx` and its `AuditFilters` client component
  - Add date range picker (Radix Popover + two `<input type="date">`) for `from`/`to` params
  - Add actor email search input for `actor` param
  - Add action keyword search input for `action` param
  - Update URL search params handling to include new params alongside existing ones
  - _Requirements: 7.3, 7.4_

- [x] 13. Build Feature Flags page
  - Create `app/[locale]/(admin)/admin/feature-flags/page.tsx` (RSC, fetches flag list server-side)
  - [x] 13.1 Create `components/admin/feature-flags/feature-flags-table.tsx`
    - TanStack Table: columns key, name, description, enabled toggle, rollout slider, plans badges, override count
    - Optimistic updates on toggle/rollout/plans changes via server actions
    - _Requirements: 6.1–6.4_
  - [x] 13.2 Create `components/admin/feature-flags/flag-overrides-sheet.tsx`
    - Radix Sheet listing existing overrides with remove button; "Add override" form with user email search + enabled/disabled select
    - _Requirements: 6.5, 6.6_
  - [x] 13.3 Create `components/admin/feature-flags/rollout-input.tsx`
    - Controlled number input using `validateRolloutPct`; shows error state for out-of-range values
    - _Requirements: 6.3_
  - [x] 13.4 Create `app/[locale]/(admin)/admin/feature-flags/_actions.ts`
    - Server actions: `toggleFlag`, `updateRollout`, `updateEnabledPlans`, `addOverride`, `removeOverride`
    - Each calls `requirePermission('system:write')`, updates DB, invalidates Redis, calls `logAudit()`
    - Returns typed `ActionResult<T>`
    - _Requirements: 6.2–6.7, 11.7, 11.8_

- [x] 14. Build System Health page
  - Create `app/[locale]/(admin)/admin/system/page.tsx` (client component with `useQuery` + `refetchInterval: 30_000`)
  - [x] 14.1 Create `components/admin/system/overall-status-banner.tsx`
    - Top-of-page banner using `computeOverallStatus`; shows "Status unavailable" + last-known timestamp on fetch error
    - _Requirements: 8.2, 8.7_
  - [x] 14.2 Create `components/admin/system/service-status-table.tsx`
    - Table of 5 services: status badge, latency ms, last checked; highlights DEGRADED/DOWN rows
    - _Requirements: 8.1, 8.3_
  - [x] 14.3 Create `components/admin/system/service-sparkline.tsx`
    - SVG row of colored segments (green/yellow/red) for 24h status history per service
    - _Requirements: 8.4_
  - [x] 14.4 Create `components/admin/system/platform-stats-grid.tsx`
    - 4 stat cards: total API requests (24h), p50/p95 latency, error rate %, cache hit rate %
    - _Requirements: 8.6_

- [x] 15. Build Teams management pages
  - [x] 15.1 Create `app/[locale]/(admin)/admin/teams/page.tsx`
    - RSC; fetches paginated team list; renders `TeamsTable` client component
    - _Requirements: 3.1_
  - [x] 15.2 Create `components/admin/teams/teams-table.tsx`
    - TanStack Table with server-side pagination; columns: name, slug, owner email, member count, plan badge, project count, created date
    - Debounced search (300ms) updates URL params; row click navigates to detail
    - _Requirements: 3.1, 3.2_
  - [x] 15.3 Create `app/[locale]/(admin)/admin/teams/[teamId]/page.tsx`
    - RSC; parallel fetch of team detail, members, invitations, projects
    - _Requirements: 3.3_
  - [x] 15.4 Create `components/admin/teams/team-meta-card.tsx`, `team-members-table.tsx`, `team-invitations-table.tsx`, `team-projects-list.tsx`
    - Members table has "Remove" button (requires `users:write`); invitations table has "Revoke" button
    - _Requirements: 3.3, 3.4, 3.5_
  - [x] 15.5 Create `components/admin/teams/delete-team-button.tsx`
    - Danger button with confirmation dialog; calls `DELETE /api/admin/teams/[teamId]`; redirects to `/admin/teams` on success
    - Requires `users:delete` permission check before rendering
    - _Requirements: 3.6, 3.7_

- [x] 16. Build Platform Analytics page
  - Create `app/[locale]/(admin)/admin/analytics/page.tsx` (client component)
  - [x] 16.1 Create `components/admin/analytics/analytics-date-range-picker.tsx`
    - Segmented control: 7d / 30d / 90d; updates `range` URL param; all charts re-fetch on change
    - _Requirements: 9.8_
  - [x] 16.2 Create `components/admin/analytics/token-kpi-row.tsx`
    - 3 stat cards: current period tokens, previous period tokens, percentage change (using `computePctChange`) with up/down arrow
    - _Requirements: 9.1_
  - [x] 16.3 Create `components/admin/analytics/daily-token-trend-chart.tsx`
    - Recharts `AreaChart` of daily token usage using `fillTrendGaps`
    - _Requirements: 9.3_
  - [x] 16.4 Create `components/admin/analytics/provider-breakdown-chart.tsx`
    - Recharts `BarChart` of token usage by provider
    - _Requirements: 9.4_
  - [x] 16.5 Create `components/admin/analytics/model-breakdown-table.tsx`
    - Top 10 models: model name, provider, token count, % of total
    - _Requirements: 9.5_
  - [x] 16.6 Create `components/admin/analytics/top-users-table.tsx`
    - Top 10 users by token consumption using `topN`; columns: avatar, name, email, plan badge, token count
    - _Requirements: 9.7_
  - [x] 16.7 Create `components/admin/analytics/export-button.tsx`
    - Triggers `GET /api/admin/analytics?export=csv&range=...`
    - _Requirements: 9.9_
  - [x] 16.8 Wire all analytics components into `analytics/page.tsx`
    - Single `useQuery` call to `GET /api/admin/analytics?range=...`; pass data to all child components
    - _Requirements: 9.1–9.9_

- [x] 17. Build Notifications/Alerts page
  - Create `app/[locale]/(admin)/admin/notifications/page.tsx` (client component)
  - [x] 17.1 Create `components/admin/notifications/unacknowledged-alerts-list.tsx`
    - Sorted list using `sortAlertsBySeverity`; severity badge per row; "Acknowledge" button per row
    - _Requirements: 10.1, 10.2_
  - [x] 17.2 Create `components/admin/notifications/acknowledge-all-button.tsx`
    - Bulk action; shows confirmation count in toast on success
    - _Requirements: 10.3_
  - [x] 17.3 Create `components/admin/notifications/alert-history-table.tsx`
    - TanStack Table of last 100 alerts; columns: severity, message, rule name, created at, acknowledged state
    - _Requirements: 10.4_
  - [x] 17.4 Create `components/admin/notifications/severity-filter.tsx` and `acknowledged-filter.tsx`
    - Segmented controls updating URL params `severity` and `acknowledged`
    - _Requirements: 10.5_
  - [x] 17.5 Create `app/[locale]/(admin)/admin/notifications/_actions.ts`
    - Server actions: `acknowledgeAlert(id)`, `acknowledgeAllAlerts()`
    - Each calls `requirePermission('analytics:write')`, updates DB, calls `logAudit()`
    - Returns typed `ActionResult<T>`
    - _Requirements: 10.2, 10.3, 11.8_

- [ ] 18. Checkpoint — Ensure all page components compile and render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Add Zustand slice for unacknowledged alert count
  - Create or extend a Zustand store (e.g., `lib/stores/admin-store.ts`) with `unacknowledgedCount` state
  - Populate via a TanStack Query hook (`useUnacknowledgedCount`) with 60s refetch interval
  - Share the value between the sidebar badge and the notifications page without double-fetching
  - _Requirements: 10.6_

- [x] 20. Update admin sidebar with new nav items and badge
  - Modify `components/admin/sidebar.tsx`
  - Add Teams nav item to the users group: `{ key: "sidebar.teams", href: "/admin/teams", permission: "users:read", icon: Building2 }`
  - Add Analytics nav item to the platform group: `{ key: "sidebar.analytics", href: "/admin/analytics", permission: "analytics:read", icon: BarChart3 }`
  - Add Notifications nav item with badge: `{ key: "sidebar.notifications", href: "/admin/notifications", permission: "analytics:read", icon: Bell, badge: unacknowledgedCount }`
  - Read `unacknowledgedCount` from the Zustand store created in task 19
  - _Requirements: 10.6, 11.5_

- [ ] 21. Add i18n translation files — English
  - [ ] 21.1 Create or extend `messages/en/admin-overview.json`
    - Add `kpi`, `health`, `charts` sections for new overview widgets
    - _Requirements: 1.8, 12.1, 12.2_
  - [ ] 21.2 Create or extend `messages/en/admin-audit-logs.json`
    - Add `dateRange`, `actor`, `action` filter keys
    - _Requirements: 7.7, 12.1, 12.2_
  - [ ] 21.3 Create `messages/en/admin-feature-flags.json`
    - Keys: `metadata.title`, `title`, `subtitle`, `table.*`, `rollout.*`, `overrides.*`, `actions.*`, `empty`, `errors.*`
    - _Requirements: 6.9, 12.1, 12.2_
  - [ ] 21.4 Create `messages/en/admin-system.json`
    - Keys: `metadata.title`, `title`, `status.*`, `services.*`, `stats.*`, `errors.*`
    - _Requirements: 8.8, 12.1, 12.2_
  - [ ] 21.5 Create `messages/en/admin-teams.json`
    - Keys: `metadata.title`, `title`, `table.*`, `detail.*`, `members.*`, `invitations.*`, `projects.*`, `actions.*`, `errors.*`
    - _Requirements: 3.8, 12.1, 12.2_
  - [ ] 21.6 Create `messages/en/admin-analytics.json`
    - Keys: `metadata.title`, `title`, `range.*`, `kpi.*`, `charts.*`, `tables.*`, `export.*`
    - _Requirements: 9.10, 12.1, 12.2_
  - [ ] 21.7 Create `messages/en/admin-notifications.json`
    - Keys: `metadata.title`, `title`, `unacknowledged.*`, `history.*`, `filters.*`, `actions.*`, `errors.*`
    - _Requirements: 10.7, 12.1, 12.2_
  - [ ] 21.8 Extend `messages/en/admin-shared.json` (or equivalent shared file)
    - Add `sidebar.teams`, `sidebar.analytics`, `sidebar.notifications`, `groups.users` keys
    - _Requirements: 12.1_

- [ ] 22. Add i18n translation files — French
  - [ ] 22.1 Create or extend `messages/fr/admin-overview.json` — identical key structure to EN, French values
    - _Requirements: 12.2, 12.5_
  - [ ] 22.2 Create or extend `messages/fr/admin-audit-logs.json`
    - _Requirements: 12.2, 12.5_
  - [ ] 22.3 Create `messages/fr/admin-feature-flags.json`
    - _Requirements: 12.2, 12.5_
  - [ ] 22.4 Create `messages/fr/admin-system.json`
    - _Requirements: 12.2, 12.5_
  - [ ] 22.5 Create `messages/fr/admin-teams.json`
    - _Requirements: 12.2, 12.5_
  - [ ] 22.6 Create `messages/fr/admin-analytics.json`
    - _Requirements: 12.2, 12.5_
  - [ ] 22.7 Create `messages/fr/admin-notifications.json`
    - _Requirements: 12.2, 12.5_
  - [ ] 22.8 Extend `messages/fr/admin-shared.json` with sidebar keys
    - _Requirements: 12.2_

- [ ] 23. Update `i18n/request.ts` to load all new namespaces
  - Import all new/extended admin translation files for both `en` and `fr` locales
  - _Requirements: 12.1_

- [ ] 24. Write property test for translation file key parity (Property 15)
  - **Property 15: Translation file key structure is identical between en/ and fr/**
  - Use `deepKeyStructureEqual` from task 1.15 and `fast-check` to assert parity across all new admin translation files
  - **Validates: Requirements 12.5**

- [ ] 25. Checkpoint — Ensure all tests pass and both EN/FR routes render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 26. Write E2E tests (Playwright)
  - Create test files under `tests/e2e/admin/`
  - [ ] 26.1 Write E2E test: feature flag toggle flow
    - Admin toggles a feature flag → change is reflected in the table
    - _Requirements: 6.2_
  - [ ] 26.2 Write E2E test: acknowledge-all alerts flow
    - Admin acknowledges all alerts → sidebar badge count drops to 0
    - _Requirements: 10.3, 10.6_
  - [ ] 26.3 Write E2E test: audit log date range filter
    - Admin applies date range filter → only matching entries are shown
    - _Requirements: 7.3_
  - [ ] 26.4 Write E2E test: RBAC redirect for non-admin
    - Non-admin user accessing `/admin/*` is redirected to `/dashboard?error=access_denied`
    - _Requirements: 11.1_
  - [ ] 26.5 Write E2E test: system health auto-refresh
    - Mock 30s timer; verify page re-fetches health data without full reload
    - _Requirements: 8.5_

- [ ] 27. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at each major phase
- Property tests validate universal correctness properties using `fast-check`
- Unit tests validate specific examples and edge cases
- The design document uses TypeScript — all implementation tasks use TypeScript strict mode
