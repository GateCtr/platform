# Design Document — Outreach CRM

## Overview

The Outreach CRM module adds a full prospecting pipeline to the GateCtr admin panel at `/admin/outreach`. It enables admins to manage prospects (Tier 1 / Tier 2), send templated emails in a 3-step sequence, track opens and clicks via pixel/redirect, schedule automatic follow-ups via BullMQ, and view engagement statistics.

The module integrates entirely with the existing stack: Prisma + PostgreSQL (Neon), BullMQ + IORedis (Upstash), Resend, Clerk RBAC, Tailwind CSS 4 + shadcn/ui, and next-intl EN/FR.

**Key design decisions:**

- Prospect `tier` and `status` are stored as plain `String` fields (not Prisma enums) to avoid a blocking migration on the existing schema and to match the user's spec. Validation is enforced at the application layer.
- The existing `EmailStatus` enum in the schema is reused for `OutreachEmailLog.status`.
- The outreach BullMQ queue is a new dedicated queue (`outreach-followups`) added to `lib/queues.ts`, processed by a new `workers/outreach.worker.ts`.
- Tracking API routes live at `app/api/track/` (not localized, consistent with all other API routes).
- The Resend webhook route is added at `app/api/webhooks/resend/route.ts`.

---

## Architecture

```mermaid
graph TD
    A[Admin Browser] -->|Server Actions| B[lib/actions/outreach.ts]
    B -->|Prisma| C[(PostgreSQL)]
    B -->|Resend API| D[Resend]
    B -->|BullMQ enqueue| E[outreach-followups queue]
    E -->|Worker processes| F[workers/outreach.worker.ts]
    F -->|Resend API| D
    F -->|Prisma| C

    G[Email Client] -->|GET pixel| H[app/api/track/open/route.ts]
    G -->|GET click| I[app/api/track/click/route.ts]
    H -->|Prisma update| C
    I -->|Prisma update + redirect| C

    D -->|Webhook POST| J[app/api/webhooks/resend/route.ts]
    J -->|Prisma update| C

    K[app/[locale]/(admin)/admin/outreach/page.tsx] -->|Server fetch| B
    K -->|Renders| L[components/admin/outreach/outreach-page.tsx]
```

### Data flow for a single email send

1. Admin clicks "Send Email" → `sendEmail(prospectId, step)` server action
2. Action fetches `OutreachTemplate` for the step, applies variable substitution
3. Generates `trackingId` (cuid), injects tracking pixel `<img>` into HTML body
4. Calls `resend.emails.send(...)`, receives `resendId`
5. Creates `OutreachEmailLog` record (`status = SENT`)
6. Updates prospect `status → CONTACTED`, `lastContactedAt = now()` if was `NEW`
7. If step 1 → enqueues BullMQ job with `delay: 3 * 24 * 60 * 60 * 1000` ms
8. If step 2 → enqueues BullMQ job with `delay: 7 * 24 * 60 * 60 * 1000` ms

---

## Components and Interfaces

### File Structure

```
prisma/
└── seed-outreach.ts                          # Seed script (50 prospects + 3 templates)

lib/
├── queues.ts                                 # ADD: OutreachFollowupJobData + outreachQueue
└── actions/
    └── outreach.ts                           # All server actions

workers/
└── outreach.worker.ts                        # BullMQ worker for follow-up jobs

app/
├── api/
│   ├── track/
│   │   ├── open/
│   │   │   └── [trackingId]/
│   │   │       └── route.ts                  # Tracking pixel
│   │   └── click/
│   │       └── [trackingId]/
│   │           └── route.ts                  # Click redirect
│   └── webhooks/
│       └── resend/
│           └── route.ts                      # Resend bounce/delivery webhook
└── [locale]/
    └── (admin)/
        └── admin/
            └── outreach/
                └── page.tsx                  # Server component (data fetch + auth)

components/
└── admin/
    └── outreach/
        ├── index.ts                          # Barrel export
        ├── outreach-page.tsx                 # Client root — 3-tab layout
        ├── prospects-tab.tsx                 # Prospects table + filters + actions
        ├── templates-tab.tsx                 # Template editor cards
        ├── stats-tab.tsx                     # KPI cards + funnel + activity feed
        ├── send-email-dialog.tsx             # Send/confirm dialog with preview
        └── prospect-status-badge.tsx         # Status badge component

messages/
├── en/
│   └── admin-outreach.json
└── fr/
    └── admin-outreach.json
```

### Server Actions (`lib/actions/outreach.ts`)

All actions are `"use server"` functions. Auth check pattern: `getCurrentUser()` → `hasPermission(userId, "analytics:read")` (ADMIN/SUPER_ADMIN have this). Unauthorized throws `new Error("Unauthorized")`.

```typescript
// Read
export async function getProspects(): Promise<ProspectWithLogs[]>;
export async function getStats(): Promise<OutreachStats>;
export async function getTemplates(): Promise<OutreachTemplate[]>;

// Mutations
export async function updateProspectStatus(
  prospectId: string,
  status: string,
): Promise<OutreachProspect>;

export async function sendEmail(
  prospectId: string,
  step: number,
  overrides?: { subject?: string; bodyHtml?: string },
): Promise<{ success: boolean; logId?: string; error?: string }>;

export async function bulkSendEmail(
  prospectIds: string[],
  step: number,
): Promise<{
  sent: number;
  failed: number;
  errors: Array<{ prospectId: string; reason: string }>;
}>;

export async function updateTemplate(
  step: number,
  data: {
    name?: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
  },
): Promise<OutreachTemplate>;

export async function scheduleFollowup(
  prospectId: string,
  step: number,
  delayDays: number,
): Promise<void>;
```

### API Routes

| Route                           | Method | Purpose                                                      |
| ------------------------------- | ------ | ------------------------------------------------------------ |
| `/api/track/open/[trackingId]`  | GET    | Return 1×1 GIF, update `openedAt` idempotently               |
| `/api/track/click/[trackingId]` | GET    | Update `clickedAt` idempotently, redirect 302 to `targetUrl` |
| `/api/webhooks/resend`          | POST   | Process `email.bounced` / `email.delivered` events           |

### Admin Page Components

**`app/[locale]/(admin)/admin/outreach/page.tsx`** — Server Component

- Checks auth via `getCurrentUser()` + `hasPermission("analytics:read")`, redirects to `/admin/overview` if unauthorized
- Fetches `prospects`, `templates`, `stats` in parallel via `Promise.all`
- Passes serialized data to `<OutreachPageClient />`

**`components/admin/outreach/outreach-page.tsx`** — Client Component (`"use client"`)

- Renders shadcn `<Tabs>` with three tabs: Prospects / Templates / Statistics
- Holds local state for selected prospects (bulk send), active filters, dialog open state

**`components/admin/outreach/prospects-tab.tsx`** — Client Component

- TanStack Table for the prospects data
- Filter bar: status multi-select, tier toggle, text search (name/email/company)
- Row actions: "Send Email" button → opens `<SendEmailDialog />`
- Bulk select via checkboxes + "Bulk Send" button
- Horizontal scroll wrapper for mobile

**`components/admin/outreach/send-email-dialog.tsx`** — Client Component

- Step selector (1/2/3)
- Live preview of template with variable substitution applied to prospect data
- Confirm button → calls `sendEmail()` server action → toast on result

**`components/admin/outreach/templates-tab.tsx`** — Client Component

- 3 cards (Step 1, 2, 3)
- Subject input + textarea for HTML body
- Variable badges (clickable → inserts `{{variable}}` at cursor)
- Live preview panel with sample data
- Save button → calls `updateTemplate()` → toast

**`components/admin/outreach/stats-tab.tsx`** — Client Component

- 6 KPI cards using shadcn `Card`
- Funnel visualization (simple bar/step chart with Recharts or CSS)
- Recent activity list (last 20 events)

---

## Data Models

### Prisma Schema Additions

```prisma
model OutreachProspect {
  id              String             @id @default(cuid())
  email           String             @unique
  firstName       String
  lastName        String
  company         String
  jobTitle        String?
  website         String?
  linkedinUrl     String?
  tier            String             // "TIER_1" | "TIER_2"
  status          String             @default("NEW")
  // ProspectStatus values: NEW | CONTACTED | REPLIED | MEETING_BOOKED | CONVERTED | REFUSED | UNSUBSCRIBED
  notes           String?
  tags            String[]           @default([])
  lastContactedAt DateTime?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  emailLogs       OutreachEmailLog[]

  @@index([tier])
  @@index([status])
  @@index([email])
  @@map("outreach_prospects")
}

model OutreachEmailLog {
  id          String    @id @default(cuid())
  prospectId  String
  resendId    String?   @unique
  subject     String
  step        Int       // 1 | 2 | 3
  status      String    @default("SENT")
  // EmailStatus values reused: SENT | DELIVERED | OPENED | CLICKED | BOUNCED | FAILED
  trackingId  String    @unique @default(cuid())
  targetUrl   String?
  openedAt    DateTime?
  clickedAt   DateTime?
  scheduledAt DateTime?
  sentAt      DateTime?
  createdAt   DateTime  @default(now())
  prospect    OutreachProspect @relation(fields: [prospectId], references: [id], onDelete: Cascade)

  @@index([prospectId])
  @@index([trackingId])
  @@index([resendId])
  @@map("outreach_email_logs")
}

model OutreachTemplate {
  id        String   @id @default(cuid())
  step      Int      @unique // 1 | 2 | 3
  name      String
  subject   String
  bodyHtml  String
  bodyText  String
  variables String[] @default([])
  // e.g. ["firstName", "lastName", "company", "jobTitle", "senderName"]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("outreach_templates")
}
```

**Note:** `tier` and `status` on `OutreachProspect`, and `status` on `OutreachEmailLog`, are plain `String` fields. Valid values are enforced at the action layer with a Zod schema. This avoids adding new Prisma enums and the associated migration complexity.

### TypeScript Types

```typescript
// lib/actions/outreach.ts — inferred from Prisma + extended

export type ProspectStatus =
  | "NEW"
  | "CONTACTED"
  | "REPLIED"
  | "MEETING_BOOKED"
  | "CONVERTED"
  | "REFUSED"
  | "UNSUBSCRIBED";

export type ProspectTier = "TIER_1" | "TIER_2";

export interface OutreachStats {
  totalProspects: number;
  byStatus: Record<ProspectStatus, number>;
  byTier: Record<ProspectTier, number>;
  totalEmailsSent: number;
  openRate: number; // 0–1
  clickRate: number; // 0–1
  replyRate: number; // 0–1
  conversionRate: number; // 0–1
}
```

### BullMQ Job Data

```typescript
// lib/queues.ts — new addition

export interface OutreachFollowupJobData {
  type: "outreach_followup";
  prospectId: string;
  step: number; // 2 or 3
}
```

---

## Variable Substitution

The substitution function is a pure string transformation applied to both `subject` and `bodyHtml`/`bodyText` before sending.

```typescript
// lib/actions/outreach.ts

const SUPPORTED_VARIABLES = [
  "firstName",
  "lastName",
  "company",
  "jobTitle",
  "senderName",
] as const;

function applyVariableSubstitution(
  template: string,
  prospect: OutreachProspect,
  senderName: string,
): string {
  return template
    .replace(/\{\{firstName\}\}/g, prospect.firstName)
    .replace(/\{\{lastName\}\}/g, prospect.lastName)
    .replace(/\{\{company\}\}/g, prospect.company)
    .replace(/\{\{jobTitle\}\}/g, prospect.jobTitle ?? "")
    .replace(/\{\{senderName\}\}/g, senderName);
}
```

The function uses global regex replacement to handle multiple occurrences of the same placeholder. Unknown placeholders are left as-is (no error thrown).

---

## Rate Limiting for Bulk Send

The bulk send action enforces a maximum of 5 emails per second using a simple token-bucket approach implemented with `setTimeout` delays — no external dependency needed.

```typescript
async function bulkSendEmail(prospectIds: string[], step: number) {
  const RATE = 5; // emails per second
  const results = { sent: 0, failed: 0, errors: [] };

  for (let i = 0; i < prospectIds.length; i++) {
    if (i > 0 && i % RATE === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    // send individual email, accumulate results
  }

  return results;
}
```

Prospects with `status === "REFUSED"` or `status === "UNSUBSCRIBED"` are skipped before the send attempt and counted in `failed` with reason `"skipped"`.

---

## Tracking Pixel Implementation

The 1×1 transparent GIF is a hardcoded 35-byte buffer (the minimal valid GIF89a):

```typescript
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);
```

The open tracking route:

1. Returns the GIF immediately with `Content-Type: image/gif`, `Cache-Control: no-store`
2. Fires a non-blocking `prisma.outreachEmailLog.updateMany` with `where: { trackingId, openedAt: null }` — idempotent by design (only updates if `openedAt` is null)

The click tracking route:

1. Looks up the log by `trackingId`
2. Updates `clickedAt` idempotently (same `where: { trackingId, clickedAt: null }` pattern)
3. Redirects 302 to `targetUrl` (or `NEXT_PUBLIC_APP_URL` if not found)

---

## BullMQ Queue Design

### Queue definition (`lib/queues.ts`)

```typescript
export const outreachQueue = new Queue<OutreachFollowupJobData>(
  "outreach-followups",
  {
    connection: redisConnection,
    ...bullmqDefaults,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 2000 },
    },
  },
);
```

### Worker (`workers/outreach.worker.ts`)

- Processes `outreach_followup` jobs
- Calls the same `sendEmail()` logic (extracted to a shared internal function)
- Skips if prospect `status` is `REFUSED` or `UNSUBSCRIBED` at execution time
- Reports errors to Sentry

### Scheduling

```typescript
// In sendEmail() action, after successful send:
if (step === 1) {
  await outreachQueue.add(
    "followup",
    {
      type: "outreach_followup",
      prospectId,
      step: 2,
    },
    { delay: 3 * 24 * 60 * 60 * 1000 },
  ); // 3 days
}
if (step === 2) {
  await outreachQueue.add(
    "followup",
    {
      type: "outreach_followup",
      prospectId,
      step: 3,
    },
    { delay: 7 * 24 * 60 * 60 * 1000 },
  ); // 7 days
}
```

---

## Resend Webhook

Route: `POST /api/webhooks/resend`

Signature verification uses the `svix` library (already used by Clerk webhooks in the codebase) or Resend's own `Webhook` class from the `resend` package.

```typescript
// Verification pattern
import { Webhook } from "resend";

const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);
const payload = await wh.verify(rawBody, headers); // throws on invalid sig
```

Event handling:

- `email.bounced` → update `OutreachEmailLog.status = "BOUNCED"`, update `OutreachProspect.status = "REFUSED"`
- `email.delivered` → update `OutreachEmailLog.status = "DELIVERED"`
- Unknown events → return 200 (no-op)
- `resendId` not found → return 200 (idempotent)

---

## Admin Sidebar Integration

Add to `components/admin/sidebar.tsx` in the `NAV_GROUPS` array, as a new group:

```typescript
{
  groupKey: "groups.outreach",
  items: [
    {
      key: "sidebar.outreachCrm",
      href: "/admin/outreach",
      permission: "analytics:read",
      icon: Mail, // from lucide-react
    },
  ],
},
```

Add translation keys to `messages/en/admin-shared.json` and `messages/fr/admin-shared.json`:

- `groups.outreach` → `"Outreach"` / `"Prospection"`
- `sidebar.outreachCrm` → `"Outreach CRM"` / `"CRM Prospection"`

---

## i18n Namespace Structure

**`messages/en/admin-outreach.json`** (and FR equivalent):

```json
{
  "metadata": { "title": "Outreach CRM", "description": "..." },
  "tabs": {
    "prospects": "Prospects",
    "templates": "Templates",
    "statistics": "Statistics"
  },
  "prospects": {
    "columns": {
      "name": "Name",
      "company": "Company",
      "jobTitle": "Job Title",
      "tier": "Tier",
      "status": "Status",
      "lastContacted": "Last Contacted",
      "actions": "Actions"
    },
    "filters": {
      "searchPlaceholder": "Search name, email, company...",
      "allStatuses": "All statuses",
      "allTiers": "All tiers"
    },
    "actions": { "sendEmail": "Send Email", "bulkSend": "Bulk Send ({count})" },
    "status": {
      "NEW": "New",
      "CONTACTED": "Contacted",
      "REPLIED": "Replied",
      "MEETING_BOOKED": "Meeting Booked",
      "CONVERTED": "Converted",
      "REFUSED": "Refused",
      "UNSUBSCRIBED": "Unsubscribed"
    },
    "tier": { "TIER_1": "Tier 1", "TIER_2": "Tier 2" }
  },
  "sendDialog": {
    "title": "Send Email",
    "step": "Step",
    "preview": "Preview",
    "confirm": "Send",
    "cancel": "Cancel",
    "success": "Email sent.",
    "error": "Failed to send email."
  },
  "bulkSend": {
    "success": "{sent} sent, {failed} failed.",
    "error": "Bulk send failed."
  },
  "templates": {
    "step": "Step {step}",
    "subject": "Subject",
    "body": "Body (HTML)",
    "variables": "Available variables",
    "preview": "Preview",
    "save": "Save template",
    "success": "Template saved.",
    "error": "Failed to save template."
  },
  "stats": {
    "kpi": {
      "totalProspects": "Total Prospects",
      "emailsSent": "Emails Sent",
      "openRate": "Open Rate",
      "clickRate": "Click Rate",
      "replyRate": "Reply Rate",
      "conversionRate": "Conversion Rate"
    },
    "funnel": { "title": "Prospect Funnel" },
    "activity": {
      "title": "Recent Activity",
      "sent": "Email sent",
      "opened": "Email opened",
      "clicked": "Link clicked",
      "bounced": "Email bounced"
    }
  },
  "errors": {
    "unauthorized": "Unauthorized.",
    "notFound": "Prospect not found."
  }
}
```

Register in `i18n/request.ts`:

```typescript
adminOutreach: (await import(`../messages/${locale}/admin-outreach.json`)).default,
```

---

## Environment Variables

Add to `.env.example`:

```dotenv
# Outreach CRM
OUTREACH_SENDER_EMAIL="outreach@gatectr.com"   # From address for outreach emails
OUTREACH_SENDER_NAME="GateCtr Team"            # Display name for outreach emails
RESEND_WEBHOOK_SECRET="whsec_..."              # Resend webhook signing secret (verify bounce/delivery events)
```

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Variable substitution completeness

_For any_ template string containing any combination of the supported placeholders (`{{firstName}}`, `{{lastName}}`, `{{company}}`, `{{jobTitle}}`, `{{senderName}}`), and any prospect data object with non-empty values for those fields, applying `applyVariableSubstitution` should produce a string that contains no remaining `{{...}}` placeholder patterns for the supported variables.

**Validates: Requirements 4.1, 6.3**

### Property 2: Prospect ordering invariant

_For any_ set of `OutreachProspect` records with varying tiers and `createdAt` timestamps, the result of `getProspects()` should be ordered such that all `TIER_1` prospects appear before all `TIER_2` prospects, and within each tier, prospects are ordered by `createdAt` descending.

**Validates: Requirements 3.1**

### Property 3: Stats computation correctness

_For any_ set of prospect and email log records, the `getStats()` function should return values where: (a) `totalProspects` equals the count of all prospect records, (b) the sum of all `byStatus` counts equals `totalProspects`, (c) `openRate` equals `openedCount / max(sentCount, 1)`, and (d) all rate values are in the range [0, 1].

**Validates: Requirements 3.5**

### Property 4: Tracking idempotency

_For any_ `OutreachEmailLog` record, calling the open-tracking or click-tracking update multiple times should result in `openedAt` (respectively `clickedAt`) being set to the timestamp of the **first** call only — subsequent calls must not overwrite the timestamp.

**Validates: Requirements 7.4, 8.3**

### Property 5: Bulk send skip invariant

_For any_ list of prospect IDs passed to `bulkSendEmail`, every prospect whose `status` is `REFUSED` or `UNSUBSCRIBED` must appear in the `errors` array with reason `"skipped"` and must not have an email sent to them.

**Validates: Requirements 5.5**

### Property 6: Funnel monotonicity invariant

_For any_ set of prospect records, the funnel stage counts computed for the statistics view must be monotonically non-increasing from left to right: `New + Contacted + Replied + Meeting Booked + Converted` ≥ `Contacted + Replied + Meeting Booked + Converted` ≥ ... ≥ `Converted`.

**Validates: Requirements 13.4**

---

## Error Handling

| Scenario                                                     | Handling                                                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Resend API error on `sendEmail`                              | Create `OutreachEmailLog` with `status = "FAILED"`, store error message, return `{ success: false, error }` |
| Unknown `trackingId` on open/click                           | Return GIF / redirect to base URL — no error thrown                                                         |
| Invalid webhook signature                                    | Return HTTP 401 immediately                                                                                 |
| `resendId` not found in webhook                              | Return HTTP 200 (idempotent)                                                                                |
| Prospect `REFUSED`/`UNSUBSCRIBED` in bulk send               | Skip, add to `errors` array with reason `"skipped"`                                                         |
| Unauthorized action call                                     | Throw `new Error("Unauthorized")` — Next.js server action error boundary handles it                         |
| BullMQ worker job failure                                    | Retry up to 3 times with exponential backoff, report to Sentry on final failure                             |
| Missing env vars (`RESEND_API_KEY`, `OUTREACH_SENDER_EMAIL`) | Throw at startup / first use with descriptive message                                                       |

---

## Testing Strategy

### Unit Tests (Vitest)

Focus on pure functions and business logic:

- `applyVariableSubstitution` — all placeholder combinations, missing fields, unknown placeholders
- `getStats` computation logic — various prospect/log distributions
- Funnel count computation
- Rate limiter timing logic
- Webhook signature verification (mock)

### Property-Based Tests (Vitest + fast-check)

Use `fast-check` (already compatible with Vitest) for the 6 correctness properties above. Each property test runs a minimum of 100 iterations.

Tag format: `// Feature: outreach-crm, Property {N}: {property_text}`

- **Property 1**: Generate arbitrary template strings with random subsets of placeholders and random prospect data → verify no supported placeholder remains after substitution
- **Property 2**: Generate random arrays of prospects with random tiers and timestamps → verify ordering invariant on `getProspects()` result
- **Property 3**: Generate random prospect/log counts → verify stats math invariants
- **Property 4**: Simulate multiple tracking calls on the same `trackingId` → verify `openedAt`/`clickedAt` is set only once
- **Property 5**: Generate random prospect lists with mixed statuses → verify refused/unsubscribed are always in errors, never sent
- **Property 6**: Generate random prospect status distributions → verify funnel counts are monotonically non-increasing

### Integration Tests

- `POST /api/webhooks/resend` with valid/invalid signatures
- `GET /api/track/open/[trackingId]` — GIF response headers, DB update
- `GET /api/track/click/[trackingId]` — redirect behavior
- Full `sendEmail` flow with mocked Resend (verify DB state after send)

### Smoke Tests

- Prisma schema: `OutreachProspect`, `OutreachEmailLog`, `OutreachTemplate` models exist with correct fields
- Seed script runs without error and is idempotent (run twice, verify counts unchanged)
- Environment variables present in `.env.example`
