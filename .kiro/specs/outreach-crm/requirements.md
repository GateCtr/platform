# Requirements Document

## Introduction

Ce module ajoute un CRM/Outreach complet à l'admin panel GateCtr, accessible à `/admin/outreach`. Il permet aux administrateurs de gérer des prospects, d'envoyer des emails de prospection en séquence (3 steps), de suivre les ouvertures et clics via pixel de tracking, et de consulter des statistiques d'engagement. Le module s'intègre à la stack existante : Prisma + PostgreSQL, BullMQ + Redis, Resend, Clerk (RBAC), Tailwind + shadcn/ui, next-intl (EN/FR).

## Glossary

- **Outreach_Module**: Le module CRM/Outreach complet accessible à `/admin/outreach`
- **Prospect**: Un contact cible stocké dans `OutreachProspect`, avec un tier (1 ou 2), un statut, et des métadonnées de contact
- **OutreachProspect**: Modèle Prisma représentant un prospect avec ses champs de contact et son statut dans le funnel
- **OutreachEmailLog**: Modèle Prisma enregistrant chaque email envoyé à un prospect, avec tracking pixel et statut de livraison
- **OutreachTemplate**: Modèle Prisma stockant les templates d'email pour chacun des 3 steps de la séquence
- **Tier**: Niveau de priorité d'un prospect — `TIER_1` (haute priorité, 18 prospects) ou `TIER_2` (priorité standard, 32 prospects)
- **ProspectStatus**: Statut d'un prospect dans le funnel — `NEW`, `CONTACTED`, `REPLIED`, `MEETING_BOOKED`, `CONVERTED`, `REFUSED`, `UNSUBSCRIBED`
- **EmailStep**: Numéro de l'email dans la séquence — `1` (initial), `2` (follow-up J+3), `3` (follow-up J+7)
- **Tracking_Pixel**: Image 1×1 GIF transparente servie par `/api/track/open/[trackingId]` pour détecter les ouvertures d'email
- **Tracking_Service**: Ensemble des routes API gérant le tracking d'ouverture et de clic
- **BullMQ_Queue**: File de jobs Redis (Upstash) utilisée pour planifier les follow-ups automatiques
- **Resend**: Service d'envoi d'email transactionnel utilisé pour tous les envois du module
- **Admin**: Utilisateur avec le rôle `ADMIN` ou `SUPER_ADMIN` dans le système RBAC Clerk
- **Rate_Limiter**: Mécanisme limitant l'envoi bulk à 5 emails par seconde maximum
- **Variable_Substitution**: Remplacement des placeholders `{{variable}}` dans un template par les valeurs réelles du prospect

## Requirements

---

### Requirement 1: Schéma de données Prisma

**User Story:** As an Admin, I want the database to store prospects, email logs, and templates, so that all outreach data is persisted and queryable.

#### Acceptance Criteria

1. THE Outreach_Module SHALL define an `OutreachProspect` model with the fields: `id`, `email`, `firstName`, `lastName`, `company`, `jobTitle`, `website`, `linkedinUrl`, `tier` (enum `TIER_1` | `TIER_2`), `status` (enum `ProspectStatus`, default `NEW`), `notes`, `tags` (String[]), `lastContactedAt`, `createdAt`, `updatedAt`, and a relation to `OutreachEmailLog[]`
2. THE Outreach_Module SHALL define an `OutreachEmailLog` model with the fields: `id`, `prospectId` (FK → OutreachProspect), `resendId`, `subject`, `step` (Int 1–3), `status` (enum `EmailStatus` existant), `trackingId` (unique, used for pixel), `targetUrl` (for click tracking), `openedAt`, `clickedAt`, `scheduledAt`, `sentAt`, `createdAt`
3. THE Outreach_Module SHALL define an `OutreachTemplate` model with the fields: `id`, `step` (Int 1–3, unique), `name`, `subject`, `bodyHtml`, `bodyText`, `variables` (String[] — liste des placeholders disponibles), `updatedAt`, `createdAt`
4. THE Outreach_Module SHALL add the `ProspectStatus` enum to the Prisma schema with values: `NEW`, `CONTACTED`, `REPLIED`, `MEETING_BOOKED`, `CONVERTED`, `REFUSED`, `UNSUBSCRIBED`
5. THE Outreach_Module SHALL add the `TIER_1` and `TIER_2` values to a new `ProspectTier` enum in the Prisma schema

---

### Requirement 2: Seed des données initiales

**User Story:** As an Admin, I want the database to be pre-populated with prospect data and default templates, so that the module is immediately usable after setup.

#### Acceptance Criteria

1. THE Outreach_Module SHALL provide a seed script at `prisma/seed-outreach.ts` that creates exactly 18 `OutreachProspect` records with `tier = TIER_1`
2. THE Outreach_Module SHALL provide a seed script that creates exactly 32 `OutreachProspect` records with `tier = TIER_2`
3. THE Outreach_Module SHALL provide a seed script that creates exactly 3 `OutreachTemplate` records, one per step (step 1, 2, 3), with subject, bodyHtml, bodyText, and variables pre-filled
4. WHEN the seed script is run a second time, THE Outreach_Module SHALL use upsert operations to avoid creating duplicate records
5. THE Outreach_Module SHALL include realistic prospect data (company names, job titles, emails) representative of GateCtr's target audience (SaaS founders, CTOs, AI/ML engineers)

---

### Requirement 3: Server Actions — Lecture et gestion des prospects

**User Story:** As an Admin, I want server actions to read and update prospect data, so that the UI can display and modify the CRM state.

#### Acceptance Criteria

1. WHEN `getProspects()` is called, THE Outreach_Module SHALL return all prospects with their associated email logs, ordered by tier then by `createdAt` descending
2. WHEN `getProspects()` is called by a user without `ADMIN` or `SUPER_ADMIN` role, THE Outreach_Module SHALL throw an `Unauthorized` error
3. WHEN `updateProspectStatus(prospectId, status)` is called with a valid `ProspectStatus`, THE Outreach_Module SHALL update the prospect's status in the database and return the updated record
4. WHEN `updateProspectStatus()` is called by a user without `ADMIN` or `SUPER_ADMIN` role, THE Outreach_Module SHALL throw an `Unauthorized` error
5. WHEN `getStats()` is called, THE Outreach_Module SHALL return an object containing: total prospects count, count per status, count per tier, total emails sent, open rate (openedAt / sentAt count), click rate (clickedAt / sentAt count), and reply rate (REPLIED + MEETING_BOOKED + CONVERTED / total contacted)

---

### Requirement 4: Server Action — Envoi d'email individuel

**User Story:** As an Admin, I want to send a templated email to a prospect with open and click tracking, so that I can track engagement at the individual level.

#### Acceptance Criteria

1. WHEN `sendEmail(prospectId, step, overrides?)` is called, THE Outreach_Module SHALL fetch the `OutreachTemplate` for the given step, apply Variable_Substitution with the prospect's data, and send the email via Resend
2. WHEN `sendEmail()` is called, THE Outreach_Module SHALL generate a unique `trackingId` (cuid), inject a Tracking_Pixel `<img>` tag at the end of the email body HTML pointing to `/api/track/open/[trackingId]`
3. WHEN `sendEmail()` is called, THE Outreach_Module SHALL create an `OutreachEmailLog` record with `status = SENT`, `step`, `trackingId`, `sentAt = now()`, and the Resend message ID
4. WHEN `sendEmail()` is called, THE Outreach_Module SHALL update the prospect's `status` to `CONTACTED` and set `lastContactedAt = now()` if the current status is `NEW`
5. WHEN `sendEmail()` is called with `step = 1`, THE Outreach_Module SHALL enqueue a BullMQ job to schedule the step-2 follow-up email after 3 days
6. WHEN `sendEmail()` is called with `step = 2`, THE Outreach_Module SHALL enqueue a BullMQ job to schedule the step-3 follow-up email after 7 days
7. WHEN `sendEmail()` is called by a user without `ADMIN` or `SUPER_ADMIN` role, THE Outreach_Module SHALL throw an `Unauthorized` error
8. IF Resend returns an error, THEN THE Outreach_Module SHALL create an `OutreachEmailLog` record with `status = FAILED` and store the error message

---

### Requirement 5: Server Action — Envoi bulk avec rate limiting

**User Story:** As an Admin, I want to send emails to multiple prospects at once with rate limiting, so that I don't exceed Resend's sending limits.

#### Acceptance Criteria

1. WHEN `bulkSendEmail(prospectIds, step)` is called, THE Outreach_Module SHALL send emails to all specified prospects using the Rate_Limiter
2. THE Rate_Limiter SHALL enforce a maximum of 5 emails per second during bulk sending
3. WHEN `bulkSendEmail()` is called, THE Outreach_Module SHALL return a result object containing: `sent` count, `failed` count, and an array of `errors` with prospectId and error message
4. WHEN `bulkSendEmail()` is called by a user without `ADMIN` or `SUPER_ADMIN` role, THE Outreach_Module SHALL throw an `Unauthorized` error
5. WHEN a prospect has `status = REFUSED` or `status = UNSUBSCRIBED`, THE Outreach_Module SHALL skip that prospect during bulk send and include it in the `failed` count with reason "skipped"

---

### Requirement 6: Server Action — Gestion des templates

**User Story:** As an Admin, I want to update email templates, so that I can customize the outreach messaging.

#### Acceptance Criteria

1. WHEN `updateTemplate(step, data)` is called with valid template data, THE Outreach_Module SHALL update the `OutreachTemplate` record for the given step and return the updated template
2. WHEN `updateTemplate()` is called by a user without `ADMIN` or `SUPER_ADMIN` role, THE Outreach_Module SHALL throw an `Unauthorized` error
3. THE Outreach_Module SHALL support the following Variable_Substitution placeholders in templates: `{{firstName}}`, `{{lastName}}`, `{{company}}`, `{{jobTitle}}`, `{{senderName}}`
4. WHEN `scheduleFollowup(prospectId, step, delayDays)` is called, THE Outreach_Module SHALL enqueue a BullMQ delayed job that will call `sendEmail()` after `delayDays` days

---

### Requirement 7: API Route — Tracking pixel d'ouverture

**User Story:** As an Admin, I want email opens to be tracked automatically, so that I can measure engagement without any action from the prospect.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/track/open/[trackingId]`, THE Tracking_Service SHALL return a 1×1 transparent GIF with `Content-Type: image/gif` and `Cache-Control: no-store`
2. WHEN a GET request is made to `/api/track/open/[trackingId]` with a known `trackingId`, THE Tracking_Service SHALL update the corresponding `OutreachEmailLog` record: set `openedAt = now()` and `status = OPENED` (if not already opened)
3. WHEN a GET request is made to `/api/track/open/[trackingId]` with an unknown `trackingId`, THE Tracking_Service SHALL still return the 1×1 GIF without throwing an error
4. THE Tracking_Service SHALL update the `OutreachEmailLog` status to `OPENED` only on the first open (idempotent — subsequent opens do not overwrite `openedAt`)

---

### Requirement 8: API Route — Tracking de clic

**User Story:** As an Admin, I want link clicks in emails to be tracked, so that I can measure prospect interest beyond opens.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/track/click/[trackingId]` with a known `trackingId`, THE Tracking_Service SHALL update the `OutreachEmailLog`: set `clickedAt = now()` and `status = CLICKED`, then redirect (HTTP 302) to the `targetUrl` stored in the log
2. WHEN a GET request is made to `/api/track/click/[trackingId]` with an unknown `trackingId`, THE Tracking_Service SHALL redirect (HTTP 302) to the application's base URL without throwing an error
3. THE Tracking_Service SHALL update `clickedAt` only on the first click (idempotent)

---

### Requirement 9: API Route — Webhook Resend

**User Story:** As an Admin, I want bounced emails to automatically update the prospect status, so that the CRM stays accurate without manual intervention.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/webhooks/resend` with a valid `RESEND_WEBHOOK_SECRET` signature, THE Outreach_Module SHALL process the event
2. WHEN the Resend webhook event type is `email.bounced`, THE Outreach_Module SHALL find the `OutreachEmailLog` by `resendId`, update its `status` to `BOUNCED`, and update the associated prospect's `status` to `REFUSED`
3. WHEN the Resend webhook event type is `email.delivered`, THE Outreach_Module SHALL update the `OutreachEmailLog` status to `DELIVERED`
4. IF the webhook signature is invalid, THEN THE Outreach_Module SHALL return HTTP 401 without processing the event
5. IF the `resendId` is not found in `OutreachEmailLog`, THEN THE Outreach_Module SHALL return HTTP 200 without error (idempotent)

---

### Requirement 10: Page admin — Structure et accès

**User Story:** As an Admin, I want a dedicated admin page at `/admin/outreach`, so that I can access all CRM features from the admin panel.

#### Acceptance Criteria

1. THE Outreach_Module SHALL provide a server component at `app/[locale]/(admin)/admin/outreach/page.tsx` that fetches initial data (prospects, templates, stats) server-side
2. WHEN a user without `ADMIN` or `SUPER_ADMIN` role accesses `/admin/outreach`, THE Outreach_Module SHALL redirect to the admin overview page
3. THE Outreach_Module SHALL provide a client component `components/admin/outreach/outreach-page.tsx` with 3 tabs using shadcn/ui `Tabs`: "Prospects", "Templates", "Statistics"
4. THE Outreach_Module SHALL be responsive: the prospects table SHALL have horizontal scroll on mobile viewports

---

### Requirement 11: Onglet Prospects

**User Story:** As an Admin, I want to view, filter, and act on prospects in a table, so that I can manage the outreach pipeline efficiently.

#### Acceptance Criteria

1. THE Outreach_Module SHALL display prospects in a table with columns: Name, Company, Job Title, Tier, Status, Last Contacted, Actions
2. THE Outreach_Module SHALL provide filter controls for: status (multi-select), tier (TIER_1 / TIER_2), and a text search on name, email, and company
3. WHEN the Admin clicks "Send Email" on a prospect row, THE Outreach_Module SHALL open a dialog showing: template preview with Variable_Substitution applied, step selector (1/2/3), and a confirm button
4. WHEN the Admin confirms sending in the dialog, THE Outreach_Module SHALL call `sendEmail()` and display a toast notification on success or failure
5. THE Outreach_Module SHALL provide a bulk select mechanism (checkboxes) and a "Bulk Send" button that calls `bulkSendEmail()` for selected prospects
6. WHEN `bulkSendEmail()` completes, THE Outreach_Module SHALL display a toast summarizing sent/failed counts

---

### Requirement 12: Onglet Templates

**User Story:** As an Admin, I want to edit the 3 email templates directly in the admin panel, so that I can customize messaging without touching the database.

#### Acceptance Criteria

1. THE Outreach_Module SHALL display 3 template cards (Step 1, Step 2, Step 3), each showing: subject, HTML body editor, and a list of available variables as clickable badges
2. WHEN the Admin clicks a variable badge, THE Outreach_Module SHALL insert the corresponding `{{variable}}` placeholder at the cursor position in the body editor
3. THE Outreach_Module SHALL provide a live preview panel showing the template rendered with sample prospect data
4. WHEN the Admin saves a template, THE Outreach_Module SHALL call `updateTemplate()` and display a toast on success or failure

---

### Requirement 13: Onglet Statistiques

**User Story:** As an Admin, I want to see outreach performance metrics, so that I can evaluate the effectiveness of the campaigns.

#### Acceptance Criteria

1. THE Outreach_Module SHALL display 6 KPI cards: Total Prospects, Emails Sent, Open Rate (%), Click Rate (%), Reply Rate (%), Conversion Rate (%)
2. THE Outreach_Module SHALL display a funnel visualization showing prospect counts at each stage: New → Contacted → Replied → Meeting Booked → Converted
3. THE Outreach_Module SHALL display a "Recent Activity" list showing the last 20 email events (sent, opened, clicked, bounced) with prospect name, event type, and timestamp
4. WHEN the funnel data is displayed, THE Outreach_Module SHALL ensure the count at each stage is less than or equal to the count at the previous stage (funnel invariant)

---

### Requirement 14: Navigation admin — Sidebar

**User Story:** As an Admin, I want to see an "Outreach CRM" item in the admin sidebar, so that I can navigate to the module from anywhere in the admin panel.

#### Acceptance Criteria

1. THE Outreach_Module SHALL add an "Outreach CRM" navigation item to the admin sidebar using the `Mail` icon from lucide-react
2. THE Outreach_Module SHALL place the "Outreach CRM" item in a new sidebar group named "Outreach" (or within an appropriate existing group)
3. THE Outreach_Module SHALL require the `analytics:read` permission to display the sidebar item (consistent with other admin nav items accessible to ADMIN role)
4. THE Outreach_Module SHALL add the sidebar translation key to `messages/en/admin-shared.json` and `messages/fr/admin-shared.json`

---

### Requirement 15: Internationalisation EN/FR

**User Story:** As an Admin, I want the entire Outreach CRM module to be available in English and French, so that the admin panel remains consistent with the rest of the application.

#### Acceptance Criteria

1. THE Outreach_Module SHALL provide translation files `messages/en/admin-outreach.json` and `messages/fr/admin-outreach.json` covering all user-facing text in the module
2. THE Outreach_Module SHALL register the `adminOutreach` namespace in `i18n/request.ts`
3. WHEN the admin panel locale is set to French, THE Outreach_Module SHALL display all labels, buttons, status values, and error messages in French
4. THE Outreach_Module SHALL use `useTranslations('adminOutreach')` in all client components and `getTranslations` in server components — no hardcoded user-facing strings

---

### Requirement 16: Variables d'environnement

**User Story:** As a developer, I want the required environment variables documented in `.env.example`, so that I can configure the module correctly in any environment.

#### Acceptance Criteria

1. THE Outreach_Module SHALL add `OUTREACH_SENDER_EMAIL` to `.env.example` with a placeholder value and a comment explaining its purpose
2. THE Outreach_Module SHALL add `OUTREACH_SENDER_NAME` to `.env.example` with a placeholder value
3. THE Outreach_Module SHALL add `RESEND_WEBHOOK_SECRET` to `.env.example` with a placeholder value and a comment explaining it is used to verify Resend webhook signatures
