/**
 * Property-Based Tests: GateCtr Webhook Fired for Every Plan Change
 * Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5
 *
 * Property 19: GateCtr webhook fired for every plan change
 *   For every Stripe event that triggers a plan change, dispatchWebhook must
 *   be called exactly once with the correct event name and payload shape.
 *   All calls are fire-and-forget (no await) — errors must not propagate.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockConstructEvent = vi.fn();
const mockStripeSubscriptionsRetrieve = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockStripeSubscriptionsRetrieve },
  },
}));

const mockDispatchWebhook = vi.fn();
vi.mock("@/lib/webhooks", () => ({ dispatchWebhook: mockDispatchWebhook }));

const mockStripeEventCreate = vi.fn();
const mockStripeEventUpdate = vi.fn();
const mockSubscriptionUpsert = vi.fn();
const mockSubscriptionUpdate = vi.fn();
const mockSubscriptionFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockUserFindUnique = vi.fn();
const mockPlanFindUnique = vi.fn();
const mockPlanFindFirst = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stripeEvent: { create: mockStripeEventCreate, update: mockStripeEventUpdate },
    subscription: {
      upsert: mockSubscriptionUpsert,
      update: mockSubscriptionUpdate,
      findUnique: mockSubscriptionFindUnique,
    },
    user: { update: mockUserUpdate, findUnique: mockUserFindUnique },
    plan: { findFirst: mockPlanFindFirst, findUnique: mockPlanFindUnique },
    $transaction: mockTransaction,
  },
}));

vi.mock("@/lib/redis", () => ({ redis: { del: vi.fn().mockResolvedValue(1) } }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/resend", () => ({
  sendBillingUpgradeEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBillingReceiptEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBillingPaymentFailedEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBillingDowngradeEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBillingRenewalReminderEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBillingCancellationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(event: object): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": "v1,valid_sig",
    },
    body: JSON.stringify(event),
  });
}

function setupCommonMocks(eventId: string) {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
  mockStripeEventCreate.mockResolvedValue({ id: eventId, processed: false });
  mockStripeEventUpdate.mockResolvedValue({ id: eventId, processed: true });
  mockPlanFindUnique.mockResolvedValue({ id: "plan-free", name: "FREE" });
  mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
  mockSubscriptionUpsert.mockResolvedValue({ id: "sub-db", status: "ACTIVE" });
  mockSubscriptionUpdate.mockResolvedValue({ id: "sub-db", status: "CANCELED" });
  mockUserUpdate.mockResolvedValue({ id: "user_1", plan: "FREE" });
  mockUserFindUnique.mockResolvedValue({ id: "user_1", email: "u@t.com", locale: "en", plan: "PRO" });
}

// ---------------------------------------------------------------------------
// Property 19: GateCtr webhook fired for every plan change
// ---------------------------------------------------------------------------

describe("Property 19: GateCtr webhook fired for every plan change", () => {
  beforeEach(() => vi.clearAllMocks());

  it(
    "dispatchWebhook called with billing.plan_upgraded after checkout.session.completed (>=100 iterations)",
    async () => {
      const { POST } = await import("@/app/api/webhooks/stripe/route");

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `evt_co_${s}`),
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `sub_${s}`),
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `cus_${s}`),
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `user_${s}`),
          async (eventId, subId, cusId, userId) => {
            vi.clearAllMocks();
            setupCommonMocks(eventId);

            const event = {
              id: eventId,
              type: "checkout.session.completed",
              data: {
                object: {
                  id: "cs_test",
                  client_reference_id: userId,
                  customer: cusId,
                  subscription: subId,
                  payment_status: "paid",
                },
              },
            };

            mockConstructEvent.mockReturnValue(event);
            mockUserFindUnique.mockResolvedValue({
              id: userId,
              email: "u@t.com",
              locale: "en",
              plan: "FREE",
              clerkId: userId,
            });
            mockPlanFindUnique.mockResolvedValue({ id: "plan-pro", name: "PRO" });
            mockStripeSubscriptionsRetrieve.mockResolvedValue({
              id: subId,
              items: { data: [{ id: "si_1", price: { id: "price_pro", recurring: { usage_type: "licensed" } } }] },
              cancel_at_period_end: false,
              current_period_start: 1700000000,
              current_period_end: 1702592000,
              trial_end: null,
              status: "active",
            });

            const res = await POST(makeRequest(event));
            expect(res.status).toBe(200);

            expect(mockDispatchWebhook).toHaveBeenCalledWith(
              userId,
              "billing.plan_upgraded",
              expect.objectContaining({
                new_plan: expect.any(String),
                subscription_id: subId,
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    "dispatchWebhook called with billing.plan_downgraded after customer.subscription.deleted (>=100 iterations)",
    async () => {
      const { POST } = await import("@/app/api/webhooks/stripe/route");

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `evt_del_${s}`),
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `sub_${s}`),
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `user_${s}`),
          async (eventId, subId, userId) => {
            vi.clearAllMocks();
            setupCommonMocks(eventId);

            const event = {
              id: eventId,
              type: "customer.subscription.deleted",
              data: {
                object: {
                  id: subId,
                  customer: "cus_test",
                  status: "canceled",
                  items: { data: [] },
                  current_period_start: 1700000000,
                  current_period_end: 1702592000,
                  cancel_at_period_end: false,
                  cancel_at: null,
                  canceled_at: Math.floor(Date.now() / 1000),
                },
              },
            };

            mockConstructEvent.mockReturnValue(event);
            mockSubscriptionFindUnique.mockResolvedValue({
              id: "sub-db",
              userId,
              stripeSubscriptionId: subId,
              user: { id: userId, email: "u@t.com", plan: "PRO" },
            });
            mockUserFindUnique.mockResolvedValue({ id: userId, email: "u@t.com", locale: "en", plan: "PRO" });

            const res = await POST(makeRequest(event));
            expect(res.status).toBe(200);

            expect(mockDispatchWebhook).toHaveBeenCalledWith(
              userId,
              "billing.plan_downgraded",
              expect.objectContaining({
                new_plan: "FREE",
                subscription_id: subId,
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    "dispatchWebhook called with billing.payment_failed after invoice.payment_failed (>=100 iterations)",
    async () => {
      const { POST } = await import("@/app/api/webhooks/stripe/route");

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `evt_pf_${s}`),
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `sub_${s}`),
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `inv_${s}`),
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `user_${s}`),
          async (eventId, subId, invoiceId, userId) => {
            vi.clearAllMocks();
            setupCommonMocks(eventId);

            const event = {
              id: eventId,
              type: "invoice.payment_failed",
              data: {
                object: {
                  id: invoiceId,
                  parent: {
                    subscription_details: {
                      subscription: subId,
                    },
                  },
                  customer: "cus_test",
                  amount_due: 2900,
                  currency: "eur",
                },
              },
            };

            mockConstructEvent.mockReturnValue(event);
            mockSubscriptionFindUnique.mockResolvedValue({
              id: "sub-db",
              userId,
              stripeSubscriptionId: subId,
            });
            mockUserFindUnique.mockResolvedValue({ id: userId, email: "u@t.com", locale: "en", plan: "PRO" });

            const res = await POST(makeRequest(event));
            expect(res.status).toBe(200);

            expect(mockDispatchWebhook).toHaveBeenCalledWith(
              userId,
              "billing.payment_failed",
              expect.objectContaining({
                subscription_id: subId,
                invoice_id: invoiceId,
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    "dispatchWebhook called with billing.trial_started after subscription enters trialing (>=100 iterations)",
    async () => {
      const { POST } = await import("@/app/api/webhooks/stripe/route");

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `evt_tr_${s}`),
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `sub_${s}`),
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `user_${s}`),
          async (eventId, subId, userId) => {
            vi.clearAllMocks();
            setupCommonMocks(eventId);

            const trialEnd = Math.floor(Date.now() / 1000) + 14 * 86400;
            const event = {
              id: eventId,
              type: "customer.subscription.updated",
              data: {
                object: {
                  id: subId,
                  customer: "cus_test",
                  status: "trialing",
                  trial_end: trialEnd,
                  items: { data: [{ id: "si_1", price: { id: "price_pro" } }] },
                  current_period_start: 1700000000,
                  current_period_end: 1702592000,
                  cancel_at_period_end: false,
                  cancel_at: null,
                },
              },
            };

            mockConstructEvent.mockReturnValue(event);
            mockSubscriptionFindUnique.mockResolvedValue({
              id: "sub-db",
              userId,
              stripeSubscriptionId: subId,
              status: "ACTIVE",
              cancelAtPeriodEnd: false,
              user: { id: userId, email: "u@t.com", plan: "FREE" },
            });
            mockPlanFindUnique.mockResolvedValue({ id: "plan-pro", name: "PRO" });
            mockUserFindUnique.mockResolvedValue({ id: userId, email: "u@t.com", locale: "en", plan: "FREE" });

            const res = await POST(makeRequest(event));
            expect(res.status).toBe(200);

            // Must dispatch trial_started for trialing status
            const calls = mockDispatchWebhook.mock.calls;
            const trialCall = calls.find((c) => c[1] === "billing.trial_started");
            expect(trialCall).toBeDefined();
            expect(trialCall![0]).toBe(userId);
            expect(trialCall![2]).toMatchObject({ plan: expect.any(String) });
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it("dispatchWebhook is fire-and-forget — errors do not propagate", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    vi.clearAllMocks();

    const eventId = "evt_dispatch_err_001";
    setupCommonMocks(eventId);

    // dispatchWebhook throws — must not affect the 200 response
    mockDispatchWebhook.mockRejectedValue(new Error("Webhook delivery failed"));

    const event = {
      id: eventId,
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_err_001",
          customer: "cus_err",
          status: "canceled",
          items: { data: [] },
          current_period_start: 1700000000,
          current_period_end: 1702592000,
          cancel_at_period_end: false,
          cancel_at: null,
          canceled_at: Math.floor(Date.now() / 1000),
        },
      },
    };

    mockConstructEvent.mockReturnValue(event);
    mockSubscriptionFindUnique.mockResolvedValue({
      id: "sub-db",
      userId: "user_err",
      stripeSubscriptionId: "sub_err_001",
      user: { id: "user_err", email: "u@t.com", plan: "PRO" },
    });
    mockUserFindUnique.mockResolvedValue({ id: "user_err", email: "u@t.com", locale: "en", plan: "PRO" });

    const res = await POST(makeRequest(event));

    // Must still return 200 even if dispatchWebhook throws
    expect(res.status).toBe(200);
  });
});
