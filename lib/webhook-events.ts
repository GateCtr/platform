/**
 * Canonical list of all webhook events emitted by GateCtr.
 * Single source of truth — used by the UI form, the worker filter,
 * and anywhere dispatchWebhook() is called.
 */

export const WEBHOOK_EVENTS = [
  // ── Requests ────────────────────────────────────────────────────────────────
  "request.completed",
  "request.failed",
  "request.routed",

  // ── Budget ──────────────────────────────────────────────────────────────────
  "budget.threshold",
  "budget.exceeded",
  "budget.reset", // emitted by cron job (not yet implemented)

  // ── Provider ────────────────────────────────────────────────────────────────
  "provider.fallback",
  "provider.error",

  // ── API Keys ─────────────────────────────────────────────────────────────────
  "api_key.created",
  "api_key.revoked",
  "api_key.expired", // emitted in lib/api-auth.ts on expiry check

  // ── Projects ─────────────────────────────────────────────────────────────────
  "project.created",

  // ── Team ─────────────────────────────────────────────────────────────────────
  "team.member.added",
  "team.member.removed",

  // ── Billing ─────────────────────────────────────────────────────────────────
  "billing.plan_upgraded",
  "billing.plan_downgraded",
  "billing.payment_failed",
  "billing.trial_started",
  "billing.trial_ending",
  "billing.subscription_cancellation_scheduled",

  // ── Usage ────────────────────────────────────────────────────────────────────
  "usage.daily", // emitted by daily cron job at midnight

  // ── Webhook meta ─────────────────────────────────────────────────────────────
  "webhook.test",
  "webhook.failed",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
