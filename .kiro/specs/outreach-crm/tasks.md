# Implementation Plan: Outreach CRM

## Overview

Full implementation of the Outreach CRM module for GateCtr admin panel. Tasks follow a bottom-up order: data layer → backend logic → API routes → i18n → UI → integration → tests.

## Tasks

- [x] 1. Prisma schema additions and migration
  - [x] 1.1 Add `OutreachProspect`, `OutreachEmailLog`, and `OutreachTemplate` models to `prisma/schema.prisma`
    - Use plain `String` fields for `tier` and `status` (no new Prisma enums) as specified in design
    - Add all indexes: `@@index([tier])`, `@@index([status])`, `@@index([email])`, `@@index([prospectId])`, `@@index([trackingId])`, `@@index([resendId])`
    - Add `@@map` table names: `outreach_prospects`, `outreach_email_logs`, `outreach_templates`
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Run Prisma migration
    - Run `pnpm prisma migrate dev --name add-outreach-crm` to generate and apply the migration
    - Run `pnpm prisma generate` to update the client
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Seed script
  - [x] 2.1 Create `prisma/seed-outreach.ts` with 18 TIER_1 + 32 TIER_2 prospects
    - Use realistic SaaS/AI/ML prospect data (founders, CTOs, ML engineers) representative of GateCtr's target audience
    - Use `prisma.outreachProspect.upsert` keyed on `email` for idempotency
    - _Requirements: 2.1, 2.2, 2.5_
  - [x] 2.2 Add 3 default `OutreachTemplate` records (step 1, 2, 3) to the seed script
    - Pre-fill `subject`, `bodyHtml`, `bodyText`, and `variables` array with `["firstName", "lastName", "company", "jobTitle", "senderName"]`
    - Use `prisma.outreachTemplate.upsert` keyed on `step` for idempotency
    - _Requirements: 2.3, 2.4_
  - [x] 2.3 Add `seed:outreach` script to `package.json`
    - Add `"seed:outreach": "tsx prisma/seed-outreach.ts"` to the `scripts` section
    - _Requirements: 2.1_

- [x] 3. BullMQ queue and worker
  - [x] 3.1 Add `OutreachFollowupJobData` interface and `outreachQueue` to `lib/queues.ts`
    - Export `interface OutreachFollowupJobData { type: "outreach_followup"; prospectId: string; step: number }`
    - Instantiate `new Queue<OutreachFollowupJobData>("outreach-followups", { connection: redisConnection, ...bullmqDefaults, defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: { count: 1000 }, removeOnFail: { count: 2000 } } })`
    - _Requirements: 4.5, 4.6, 6.4_
  - [x] 3.2 Create `workers/outreach.worker.ts` BullMQ worker
    - Process `outreach_followup` jobs by calling the internal `sendEmailInternal()` function
    - Skip if prospect `status` is `REFUSED` or `UNSUBSCRIBED` at execution time
    - Report final failures to Sentry
    - Register the worker in `workers/index.ts`
    - _Requirements: 4.5, 4.6_

- [x] 4. Server actions (`lib/actions/outreach.ts`)
  - [x] 4.1 Implement read actions: `getProspects()`, `getStats()`, `getTemplates()`
    - `getProspects()`: return all prospects with `emailLogs`, ordered by `tier ASC` then `createdAt DESC`
    - `getStats()`: compute `totalProspects`, `byStatus`, `byTier`, `totalEmailsSent`, `openRate`, `clickRate`, `replyRate`, `conversionRate` — all rates clamped to [0, 1]
    - `getTemplates()`: return all 3 templates ordered by `step ASC`
    - All actions: auth check via `getCurrentUser()` + `hasPermission(userId, "analytics:read")`, throw `new Error("Unauthorized")` if denied
    - _Requirements: 3.1, 3.2, 3.5_
  - [x] 4.2 Implement `updateProspectStatus(prospectId, status)` and `updateTemplate(step, data)`
    - Validate `status` against `ProspectStatus` values using Zod before writing
    - `updateTemplate`: find by `step`, update fields, return updated record
    - Auth check on both actions
    - _Requirements: 3.3, 3.4, 6.1, 6.2_
  - [x] 4.3 Implement `applyVariableSubstitution()` pure function and `sendEmail()` action
    - `applyVariableSubstitution`: global regex replace for all 5 supported placeholders; unknown placeholders left as-is
    - `sendEmail`: fetch template → apply substitution → generate `trackingId` (cuid) → inject tracking pixel `<img>` → call `resend.emails.send()` → create `OutreachEmailLog` → update prospect status if `NEW` → enqueue BullMQ follow-up job for step 1 or 2
    - On Resend error: create log with `status = "FAILED"`, return `{ success: false, error }`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 6.3_
  - [x] 4.4 Implement `bulkSendEmail(prospectIds, step)` and `scheduleFollowup()` actions
    - `bulkSendEmail`: skip `REFUSED`/`UNSUBSCRIBED` prospects (add to `errors` with reason `"skipped"`), rate-limit at 5/sec using `setTimeout` delay, accumulate `{ sent, failed, errors }`
    - `scheduleFollowup`: enqueue BullMQ delayed job with `delayDays * 24 * 60 * 60 * 1000` ms delay
    - Auth check on both
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.4_

- [x] 5. API routes — tracking and webhook
  - [x] 5.1 Create open-tracking route `app/api/track/open/[trackingId]/route.ts`
    - Return hardcoded 35-byte transparent GIF (`R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`) with `Content-Type: image/gif`, `Cache-Control: no-store`
    - Fire non-blocking `prisma.outreachEmailLog.updateMany({ where: { trackingId, openedAt: null }, data: { openedAt: new Date(), status: "OPENED" } })`
    - Unknown `trackingId`: still return GIF, no error
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 5.2 Create click-tracking route `app/api/track/click/[trackingId]/route.ts`
    - Look up log by `trackingId`, update `clickedAt` idempotently (`where: { trackingId, clickedAt: null }`), set `status = "CLICKED"`
    - Redirect 302 to `targetUrl` or `NEXT_PUBLIC_APP_URL` if not found
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 5.3 Create Resend webhook route `app/api/webhooks/resend/route.ts`
    - Verify signature using `Webhook` from `resend` package with `RESEND_WEBHOOK_SECRET`; return 401 on invalid signature
    - Handle `email.bounced`: update `OutreachEmailLog.status = "BOUNCED"`, update prospect `status = "REFUSED"`
    - Handle `email.delivered`: update `OutreachEmailLog.status = "DELIVERED"`
    - Unknown events and missing `resendId`: return 200 (idempotent)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 6. i18n translation files and registration
  - [x] 6.1 Create `messages/en/admin-outreach.json` with all English strings
    - Cover all namespaces from design: `metadata`, `tabs`, `prospects` (columns, filters, actions, status, tier), `sendDialog`, `bulkSend`, `templates`, `stats` (kpi, funnel, activity), `errors`
    - _Requirements: 15.1, 15.4_
  - [x] 6.2 Create `messages/fr/admin-outreach.json` with all French translations
    - Mirror the exact same key structure as the EN file
    - _Requirements: 15.1, 15.3_
  - [x] 6.3 Add sidebar translation keys to `messages/en/admin-shared.json` and `messages/fr/admin-shared.json`
    - Add `groups.outreach` → `"Outreach"` / `"Prospection"`
    - Add `sidebar.outreachCrm` → `"Outreach CRM"` / `"CRM Prospection"`
    - _Requirements: 14.4_
  - [x] 6.4 Register `adminOutreach` namespace in `i18n/request.ts`
    - Add `adminOutreach: (await import(\`../messages/\${locale}/admin-outreach.json\`)).default` to the messages object
    - _Requirements: 15.2_

- [x] 7. Admin page server component
  - [x] 7.1 Create `app/[locale]/(admin)/admin/outreach/page.tsx` server component
    - Auth check: `getCurrentUser()` + `hasPermission("analytics:read")`; redirect to `/admin/overview` if unauthorized
    - Fetch `prospects`, `templates`, `stats` in parallel via `Promise.all([getProspects(), getTemplates(), getStats()])`
    - Pass serialized data as props to `<OutreachPageClient />`
    - Use `getTranslations('adminOutreach')` for metadata
    - _Requirements: 10.1, 10.2, 15.4_

- [x] 8. Client components
  - [x] 8.1 Create `components/admin/outreach/outreach-page.tsx` root client component
    - `"use client"` — render shadcn `<Tabs>` with three tabs: Prospects / Templates / Statistics
    - Hold local state: `selectedProspectIds`, `activeFilters`, `dialogOpen`
    - Use `useTranslations('adminOutreach')` for all labels
    - _Requirements: 10.3, 15.4_
  - [x] 8.2 Create `components/admin/outreach/prospects-tab.tsx`
    - TanStack Table with columns: Name, Company, Job Title, Tier, Status, Last Contacted, Actions
    - Filter bar: status multi-select, tier toggle (TIER_1/TIER_2), text search on name/email/company
    - Row action: "Send Email" button → opens `<SendEmailDialog />`
    - Bulk select via checkboxes + "Bulk Send ({count})" button → calls `bulkSendEmail()` → toast
    - Horizontal scroll wrapper (`overflow-x-auto`) for mobile
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 10.4_
  - [x] 8.3 Create `components/admin/outreach/send-email-dialog.tsx`
    - Step selector (1/2/3), live preview with `applyVariableSubstitution` applied to prospect data
    - Confirm button → calls `sendEmail()` server action → sonner toast on success/failure
    - _Requirements: 11.3, 11.4_
  - [x] 8.4 Create `components/admin/outreach/templates-tab.tsx`
    - 3 cards (Step 1, 2, 3): subject input + HTML body textarea + variable badges
    - Clicking a variable badge inserts `{{variable}}` at cursor position
    - Live preview panel with sample prospect data
    - Save button → calls `updateTemplate()` → toast
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  - [x] 8.5 Create `components/admin/outreach/stats-tab.tsx`
    - 6 KPI cards using shadcn `Card`: Total Prospects, Emails Sent, Open Rate, Click Rate, Reply Rate, Conversion Rate
    - Funnel visualization (Recharts or CSS steps): New → Contacted → Replied → Meeting Booked → Converted
    - Recent activity list (last 20 events) with prospect name, event type, timestamp
    - _Requirements: 13.1, 13.2, 13.3_
  - [x] 8.6 Create `components/admin/outreach/index.ts` barrel export
    - Export all outreach components from a single index file
    - _Requirements: 10.3_

- [x] 9. Admin sidebar integration
  - [x] 9.1 Add "Outreach CRM" nav item to `components/admin/sidebar.tsx`
    - Add new group `{ groupKey: "groups.outreach", items: [{ key: "sidebar.outreachCrm", href: "/admin/outreach", permission: "analytics:read", icon: Mail }] }` to `NAV_GROUPS`
    - Import `Mail` from `lucide-react`
    - _Requirements: 14.1, 14.2, 14.3_

- [x] 10. Environment variables
  - [x] 10.1 Add outreach env vars to `.env.example`
    - Add `OUTREACH_SENDER_EMAIL`, `OUTREACH_SENDER_NAME`, and `RESEND_WEBHOOK_SECRET` with placeholder values and comments
    - _Requirements: 16.1, 16.2, 16.3_

- [x] 11. Checkpoint — wire everything together
  - Verify the admin page loads at `/admin/outreach` with data from server actions
  - Verify the sidebar item appears for ADMIN/SUPER_ADMIN users
  - Verify tracking pixel route returns a GIF and updates the DB
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Property-based and unit tests
  - [ ]\* 12.1 Write property test for variable substitution completeness (Property 1)
    - Use `fast-check` to generate arbitrary template strings with random subsets of the 5 supported placeholders and random prospect data
    - Assert no supported `{{...}}` placeholder remains in the output after `applyVariableSubstitution`
    - Tag: `// Feature: outreach-crm, Property 1: variable substitution completeness`
    - **Validates: Requirements 4.1, 6.3**
  - [ ]\* 12.2 Write property test for prospect ordering invariant (Property 2)
    - Generate random arrays of prospects with random `tier` and `createdAt` values
    - Assert all TIER_1 records precede all TIER_2 records, and within each tier records are sorted by `createdAt` descending
    - Tag: `// Feature: outreach-crm, Property 2: prospect ordering invariant`
    - **Validates: Requirements 3.1**
  - [ ]\* 12.3 Write property test for stats computation correctness (Property 3)
    - Generate random prospect/log count distributions
    - Assert: `sum(byStatus) === totalProspects`, `openRate === openedCount / max(sentCount, 1)`, all rates in [0, 1]
    - Tag: `// Feature: outreach-crm, Property 3: stats computation correctness`
    - **Validates: Requirements 3.5**
  - [ ]\* 12.4 Write property test for tracking idempotency (Property 4)
    - Simulate multiple open/click tracking calls on the same `trackingId`
    - Assert `openedAt` / `clickedAt` is set only on the first call; subsequent calls do not overwrite the timestamp
    - Tag: `// Feature: outreach-crm, Property 4: tracking idempotency`
    - **Validates: Requirements 7.4, 8.3**
  - [ ]\* 12.5 Write property test for bulk send skip invariant (Property 5)
    - Generate random prospect lists with mixed statuses including `REFUSED` and `UNSUBSCRIBED`
    - Assert every skipped prospect appears in `errors` with reason `"skipped"` and has no email sent
    - Tag: `// Feature: outreach-crm, Property 5: bulk send skip invariant`
    - **Validates: Requirements 5.5**
  - [ ]\* 12.6 Write property test for funnel monotonicity invariant (Property 6)
    - Generate random prospect status distributions
    - Assert funnel stage counts are monotonically non-increasing from left to right
    - Tag: `// Feature: outreach-crm, Property 6: funnel monotonicity invariant`
    - **Validates: Requirements 13.4**
  - [ ]\* 12.7 Write unit tests for `applyVariableSubstitution`
    - Test all 5 placeholder combinations, missing/empty fields, unknown placeholders left as-is, multiple occurrences of same placeholder
    - _Requirements: 4.1, 6.3_
  - [ ]\* 12.8 Write unit tests for `getStats` computation logic
    - Test various prospect/log distributions, zero-division guard (`max(sentCount, 1)`), rate clamping
    - _Requirements: 3.5_
  - [ ]\* 12.9 Write integration tests for API routes
    - `POST /api/webhooks/resend` with valid and invalid signatures
    - `GET /api/track/open/[trackingId]` — verify GIF response headers and DB update
    - `GET /api/track/click/[trackingId]` — verify redirect behavior and idempotency
    - _Requirements: 7.1, 7.2, 7.4, 8.1, 8.3, 9.1, 9.4_

- [ ] 13. Final checkpoint
  - Ensure all non-optional tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (already in `devDependencies`) with Vitest — run via `pnpm test:property`
- The worker task (3.2) is marked optional if BullMQ infrastructure is already partially set up; the queue definition (3.1) is required regardless
- All client components must use `useTranslations('adminOutreach')` — no hardcoded user-facing strings
- `tier` and `status` fields are plain `String` in Prisma; Zod validation at the action layer enforces valid values
- Tracking routes are at `app/api/track/` (not localized), consistent with all other API routes
