# Requirements Document

## Introduction

GateCtr's admin dashboard is the internal control plane for the platform. It gives super-admins and admins full visibility and control over users, teams, billing, feature flags, system health, and platform-wide analytics.

The user-facing dashboard is already complete. This spec covers the **admin area** at `app/[locale]/(admin)/admin/` — auditing what exists, identifying gaps, and specifying what must be built to reach production-grade quality comparable to Vercel, Linear, or Stripe's internal dashboards.

### Audit Summary — What Already Exists

| Page / Feature | Status |
|---|---|
| Admin layout (sidebar, header, RBAC guard) | ✅ Complete |
| Overview page (waitlist funnel stats) | ⚠️ Partial — waitlist only, no platform KPIs |
| User management (list, search, filter, role, suspend, ban, delete) | ✅ Complete |
| Waitlist management (list, filter, invite, skip, delete, CSV export) | ✅ Complete |
| Billing (MRR/ARR, subscriptions, events, coupons, refunds, detail page) | ✅ Complete |
| Audit logs (list, filter by resource/status/search, export CSV) | ⚠️ Partial — missing date range, action, actor filters |
| Feature flags page | ❌ Missing — sidebar link exists, no page |
| System health page | ❌ Missing — sidebar link exists, no page |
| Teams / organization management | ❌ Missing — no admin page |
| Platform analytics (token usage, revenue trends, active users) | ❌ Missing — no dedicated section |
| Admin notifications / alerts management | ❌ Missing |

---

## Glossary

- **Admin_Dashboard**: The admin-only area at `/admin/*`, protected by `requireAdmin()` and RBAC.
- **Platform_Analytics**: Aggregated, cross-tenant metrics visible only to admins (total tokens, revenue, active users).
- **Feature_Flag**: A `FeatureFlag` DB record with a key, enabled state, rollout percentage, and per-plan or per-user overrides.
- **System_Health**: The `SystemHealth` DB model tracking status of services: `app`, `database`, `redis`, `queue`, `stripe`.
- **Team**: A `Team` DB record representing a multi-user workspace with members, roles, and invitations.
- **Alert**: An `Alert` DB record linked to an `AlertRule`, with severity, message, and acknowledgement state.
- **Audit_Log**: An `AuditLog` DB record capturing who did what, on which resource, when, and whether it succeeded.
- **Subscription**: A `Subscription` DB record linked to a Stripe subscription, tracking plan, status, and billing period.
- **RBAC**: Role-Based Access Control. Roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `SUPPORT`, `DEVELOPER`, `VIEWER`.
- **Permission**: A `resource:action` string (e.g., `users:read`, `billing:write`, `system:read`).
- **Coupon**: A Stripe coupon with optional promo code, discount type, duration, and redemption limits.
- **MRR**: Monthly Recurring Revenue — sum of active subscription plan prices.

---

## Requirements

### Requirement 1: Platform Overview Dashboard

**User Story:** As an admin, I want a single overview page showing platform-wide KPIs, so that I can assess the health and growth of GateCtr at a glance.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display total registered users, total active subscriptions, MRR, and total tokens processed in the current month on the overview page.
2. WHEN the overview page loads, THE Admin_Dashboard SHALL fetch and display the current system health status (healthy / degraded / down) as a summary widget.
3. THE Admin_Dashboard SHALL display a 7-day new user signup trend chart on the overview page.
4. THE Admin_Dashboard SHALL display plan distribution (count per plan: Free, Pro, Team, Enterprise) on the overview page.
5. THE Admin_Dashboard SHALL display the waitlist funnel stats (total, waiting, invited, joined, skipped) on the overview page.
6. WHEN any KPI metric is loading, THE Admin_Dashboard SHALL display skeleton placeholders in place of the metric values.
7. IF a data fetch fails, THEN THE Admin_Dashboard SHALL display an inline error state for the affected widget without blocking the rest of the page.
8. THE Admin_Dashboard SHALL render the overview page in both English and French using `next-intl` translations.

---

### Requirement 2: User Management

**User Story:** As an admin, I want to list, search, filter, and manage all platform users, so that I can handle support requests, enforce policies, and maintain platform integrity.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display all users in a paginated, sortable table with columns: avatar, name, email, plan, roles, status (active/banned), project count, token usage (30-day), and join date.
2. WHEN an admin types in the search field, THE Admin_Dashboard SHALL filter users by name or email within 300ms of the last keystroke (debounced).
3. THE Admin_Dashboard SHALL allow filtering users by plan (Free, Pro, Team, Enterprise), by status (active, suspended, banned), and by role.
4. WHEN an admin clicks a user row, THE Admin_Dashboard SHALL open a detail sheet showing full user profile, roles, subscription status, recent audit log entries, and available actions.
5. WHEN an admin assigns a role to a user, THE Admin_Dashboard SHALL update the role in the database, sync it to Clerk `publicMetadata`, invalidate the Redis permission cache, and log an audit entry.
6. WHEN an admin suspends a user, THE Admin_Dashboard SHALL set `isActive: false`, call `clerk.users.banUser()`, send a suspension email via Resend, and log an audit entry.
7. WHEN an admin bans a user with a reason, THE Admin_Dashboard SHALL set `isBanned: true`, `isActive: false`, store the reason, call `clerk.users.banUser()`, send a ban email via Resend, and log an audit entry.
8. WHEN an admin reactivates a user, THE Admin_Dashboard SHALL set `isActive: true`, `isBanned: false`, call `clerk.users.unbanUser()`, send a reactivation email via Resend, and log an audit entry.
9. WHEN an admin deletes a user, THE Admin_Dashboard SHALL send a deletion email before removing the record, delete the user from Clerk, delete the user from the database (cascade), and log an audit entry.
10. WHEN an admin forces sign-out for a user, THE Admin_Dashboard SHALL revoke all active Clerk sessions for that user and log an audit entry.
11. WHEN an admin changes a user's plan, THE Admin_Dashboard SHALL update `user.plan` in the database and log an audit entry with old and new plan values.
12. IF an admin attempts a write action without `users:write` permission, THEN THE Admin_Dashboard SHALL return a 403 error and display an access-denied message.
13. THE Admin_Dashboard SHALL render the user management page in both English and French.

---

### Requirement 3: Team / Organization Management

**User Story:** As an admin, I want to view and manage all teams on the platform, so that I can handle enterprise support, investigate issues, and enforce policies across organizations.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display all teams in a paginated table with columns: team name, slug, owner email, member count, plan (derived from owner), project count, and creation date.
2. WHEN an admin searches teams, THE Admin_Dashboard SHALL filter by team name, slug, or owner email within 300ms (debounced).
3. WHEN an admin clicks a team row, THE Admin_Dashboard SHALL display a detail view showing: team metadata, owner info, full member list with roles, pending invitations, and associated projects.
4. THE Admin_Dashboard SHALL allow an admin with `users:write` permission to remove a member from a team, which SHALL update the `TeamMember` record and log an audit entry.
5. THE Admin_Dashboard SHALL allow an admin with `users:write` permission to revoke a pending team invitation, which SHALL set `revokedAt` on the `TeamInvitation` record and log an audit entry.
6. THE Admin_Dashboard SHALL allow an admin with `users:delete` permission to delete a team, which SHALL cascade-delete all team members, invitations, projects, and API keys, and log an audit entry.
7. IF an admin attempts a write action without `users:write` permission, THEN THE Admin_Dashboard SHALL return a 403 error and display an access-denied message.
8. THE Admin_Dashboard SHALL render the teams management page in both English and French.

---

### Requirement 4: Billing & Subscription Management

**User Story:** As an admin, I want full visibility into subscriptions, revenue metrics, and billing events, and the ability to issue refunds and manage coupons, so that I can handle billing support and track revenue health.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display MRR, ARR, total active subscriptions, churn rate, new subscriptions this month, and revenue at risk (past-due MRR) on the billing overview tab.
2. THE Admin_Dashboard SHALL display a 6-month MRR trend area chart on the billing overview tab.
3. THE Admin_Dashboard SHALL display plan distribution (count and percentage per plan) on the billing overview tab.
4. THE Admin_Dashboard SHALL list all non-incomplete subscriptions in a filterable table with columns: user, plan, status, billing period end, and Stripe subscription ID (visible to `billing:write` only).
5. WHEN an admin clicks a subscription row, THE Admin_Dashboard SHALL navigate to a subscription detail page showing: user profile, subscription stats, invoice history from Stripe, and billing audit log.
6. WHEN an admin with `billing:write` issues a refund on a subscription detail page, THE Admin_Dashboard SHALL call `stripe.refunds.create()`, log a `billing.refund_issued` audit entry, and display the refund confirmation.
7. IF the Stripe refund API call fails, THEN THE Admin_Dashboard SHALL display the Stripe error message and log a failed audit entry.
8. THE Admin_Dashboard SHALL allow an admin with `billing:write` to create a Stripe coupon with: name, discount type (percent or fixed), duration (once/repeating/forever), optional promo code, max redemptions, and expiry date.
9. THE Admin_Dashboard SHALL allow an admin with `billing:write` to delete a Stripe coupon and its associated promo code.
10. THE Admin_Dashboard SHALL display the 50 most recent billing audit events (subscription created, updated, canceled, payment succeeded/failed, refund issued) in a chronological event feed.
11. THE Admin_Dashboard SHALL render the billing management page in both English and French.

---

### Requirement 5: Waitlist Management

**User Story:** As an admin, I want to manage the waitlist — invite, skip, and delete entries — so that I can control platform access during the beta phase.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display all waitlist entries in a paginated table (50 per page) with columns: position, email, name, company, status, and join date.
2. WHEN an admin searches the waitlist, THE Admin_Dashboard SHALL filter by email or name within 300ms (debounced).
3. THE Admin_Dashboard SHALL allow filtering waitlist entries by status: all, WAITING, INVITED, JOINED, SKIPPED.
4. WHEN an admin selects one or more WAITING entries and clicks "Invite", THE Admin_Dashboard SHALL call `POST /api/waitlist/invite` with the selected entry IDs and display the count of successfully invited entries.
5. WHEN an admin skips (blacklists) an entry, THE Admin_Dashboard SHALL set the entry status to SKIPPED and display a confirmation.
6. WHEN an admin deletes an entry, THE Admin_Dashboard SHALL permanently remove the waitlist record after confirmation.
7. THE Admin_Dashboard SHALL allow exporting the current filtered view as a CSV file via `GET /api/waitlist?export=csv`.
8. THE Admin_Dashboard SHALL render the waitlist management page in both English and French.

---

### Requirement 6: Feature Flags Management

**User Story:** As an admin, I want to manage feature flags — enable/disable, set rollout percentages, restrict to plans, and add per-user overrides — so that I can safely roll out new features.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display all feature flags in a table with columns: key, name, description, enabled state, rollout percentage, enabled plans, and override count.
2. WHEN an admin toggles a feature flag's enabled state, THE Admin_Dashboard SHALL update the `FeatureFlag.enabled` field in the database and log an audit entry with old and new values.
3. WHEN an admin updates a feature flag's rollout percentage (0–100), THE Admin_Dashboard SHALL validate the value is an integer between 0 and 100, update `FeatureFlag.rolloutPct`, and log an audit entry.
4. WHEN an admin updates the enabled plans for a feature flag, THE Admin_Dashboard SHALL update `FeatureFlag.enabledPlans` and log an audit entry.
5. THE Admin_Dashboard SHALL allow an admin to add a per-user override for a feature flag, specifying the user (by email) and the override value (enabled/disabled), which SHALL create a `FeatureFlagOverride` record.
6. THE Admin_Dashboard SHALL allow an admin to remove a per-user override, which SHALL delete the `FeatureFlagOverride` record.
7. WHEN a feature flag is toggled, THE Admin_Dashboard SHALL invalidate any cached flag state for affected users.
8. IF an admin attempts a write action without `system:read` permission, THEN THE Admin_Dashboard SHALL return a 403 error and display an access-denied message.
9. THE Admin_Dashboard SHALL render the feature flags page in both English and French.

---

### Requirement 7: Audit Logs

**User Story:** As an admin, I want to search, filter, and export audit logs, so that I can investigate security incidents, support issues, and compliance requirements.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display audit logs in a paginated table (25 per page) with columns: timestamp, user email, resource, action, and status (success/failed).
2. WHEN an admin clicks an audit log row, THE Admin_Dashboard SHALL expand an inline detail panel showing: log ID, timestamp, user, actor, resource, action, resource ID, IP address, user agent, error message, old value, and new value.
3. THE Admin_Dashboard SHALL allow filtering audit logs by: resource type (from distinct values in DB), status (success/failed), user email (search), actor email (search), action keyword, and date range (from/to).
4. WHEN an admin applies filters, THE Admin_Dashboard SHALL update the URL search params and re-fetch logs server-side, preserving filter state on page refresh.
5. THE Admin_Dashboard SHALL allow exporting the current filtered view as a CSV file via `GET /api/admin/audit-logs` with the active filter params.
6. THE Admin_Dashboard SHALL display the total count of matching log entries.
7. THE Admin_Dashboard SHALL render the audit logs page in both English and French.

---

### Requirement 8: System Health & Monitoring

**User Story:** As an admin, I want to see the real-time health status of all platform services, so that I can detect and respond to incidents quickly.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display the health status of each service (app, database, redis, queue, stripe) with status indicator (healthy / degraded / down), last checked timestamp, and latency in milliseconds.
2. THE Admin_Dashboard SHALL display an overall platform status badge (healthy / degraded / down) computed from the worst individual service status.
3. WHEN any service status is `DEGRADED` or `DOWN`, THE Admin_Dashboard SHALL highlight that service row with a warning or error color.
4. THE Admin_Dashboard SHALL display the 24-hour health history for each service as a sparkline or status timeline.
5. THE Admin_Dashboard SHALL auto-refresh the health status every 30 seconds without a full page reload.
6. THE Admin_Dashboard SHALL display platform-wide statistics: total API requests in the last 24 hours, average latency (p50/p95), error rate percentage, and cache hit rate.
7. IF the health data fetch fails, THEN THE Admin_Dashboard SHALL display a "Status unavailable" message and the last known status with its timestamp.
8. THE Admin_Dashboard SHALL render the system health page in both English and French.

---

### Requirement 9: Platform Analytics

**User Story:** As an admin, I want platform-wide analytics — total token usage, revenue trends, active user counts, and model usage breakdown — so that I can make data-driven product and pricing decisions.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display total tokens processed platform-wide for the current month, previous month, and percentage change.
2. THE Admin_Dashboard SHALL display total tokens saved by the Context Optimizer platform-wide for the current month.
3. THE Admin_Dashboard SHALL display a 30-day daily token usage trend chart aggregated across all users.
4. THE Admin_Dashboard SHALL display a breakdown of token usage by LLM provider (OpenAI, Anthropic, Mistral, Gemini) for the current month.
5. THE Admin_Dashboard SHALL display a breakdown of token usage by model for the top 10 models in the current month.
6. THE Admin_Dashboard SHALL display the count of daily active users (DAU) and monthly active users (MAU) for the current period.
7. THE Admin_Dashboard SHALL display the top 10 users by token consumption for the current month, with their plan and usage amount.
8. WHEN an admin selects a date range (7d, 30d, 90d), THE Admin_Dashboard SHALL re-fetch and re-render all analytics charts for the selected period.
9. THE Admin_Dashboard SHALL allow exporting the platform analytics summary as a CSV file.
10. THE Admin_Dashboard SHALL render the analytics page in both English and French.

---

### Requirement 10: Admin Notifications & Alerts

**User Story:** As an admin, I want to view and manage platform-level alerts — unacknowledged alerts, alert rules, and alert history — so that I can respond to critical platform events.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display all unacknowledged alerts in a list sorted by severity (critical → warning → info) and creation date.
2. WHEN an admin acknowledges an alert, THE Admin_Dashboard SHALL set `Alert.acknowledged: true`, `Alert.acknowledgedAt`, and `Alert.acknowledgedBy` in the database.
3. WHEN an admin acknowledges all alerts, THE Admin_Dashboard SHALL bulk-update all unacknowledged alerts and display a confirmation count.
4. THE Admin_Dashboard SHALL display alert history (last 100 alerts) with columns: severity, message, rule name, created at, and acknowledged state.
5. THE Admin_Dashboard SHALL allow filtering alerts by severity (critical, warning, info) and by acknowledged state (all, unacknowledged, acknowledged).
6. THE Admin_Dashboard SHALL display the count of unacknowledged alerts as a badge on the sidebar navigation item.
7. THE Admin_Dashboard SHALL render the notifications/alerts page in both English and French.

---

### Requirement 11: Access Control & Security

**User Story:** As a platform operator, I want all admin pages and actions to be protected by RBAC, so that only authorized roles can access sensitive operations.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL require the current user to have an admin role (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, or `SUPPORT`) to access any page under `/admin/*`, redirecting unauthorized users to `/dashboard?error=access_denied`.
2. WHEN a user without `users:write` permission attempts a write action (role change, suspend, ban, delete), THE Admin_Dashboard SHALL return HTTP 403 and display an access-denied message without performing the action.
3. WHEN a user without `billing:write` permission attempts a billing write action (refund, coupon create/delete), THE Admin_Dashboard SHALL return HTTP 403 and display an access-denied message.
4. WHEN a user without `system:read` permission attempts to access the feature flags or system health pages, THE Admin_Dashboard SHALL redirect to `/admin/overview`.
5. THE Admin_Dashboard SHALL filter sidebar navigation items to show only links the current user has permission to access.
6. WHILE a user session is active in the admin area, THE Admin_Dashboard SHALL re-validate permissions on each server action call without relying solely on client-side state.
7. THE Admin_Dashboard SHALL use CSRF validation on all server actions that mutate data.
8. FOR ALL admin write actions, THE Admin_Dashboard SHALL create an `AuditLog` entry recording the actor, target resource, action, old value, new value, and success state.

---

### Requirement 12: Internationalization

**User Story:** As a platform operator, I want all admin pages to be available in English and French, so that the admin team can work in their preferred language.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display all user-facing text using `next-intl` `useTranslations()` — no hardcoded strings in components.
2. FOR ALL new admin pages, THE Admin_Dashboard SHALL have corresponding translation files in both `messages/en/` and `messages/fr/`.
3. WHEN a user switches language via the `LanguageSwitcher`, THE Admin_Dashboard SHALL re-render all text in the selected language without a full page reload.
4. THE Admin_Dashboard SHALL use the `localePrefix: 'as-needed'` strategy — English at `/admin/*`, French at `/fr/admin/*`.
5. FOR ALL new translation files, THE Admin_Dashboard SHALL maintain structural parity between `messages/en/` and `messages/fr/` — identical key structure, both files present.
