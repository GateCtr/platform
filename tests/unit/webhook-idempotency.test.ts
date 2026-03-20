/**
 * Property-Based Tests for Webhook Idempotency
 *
 * **Validates: Requirement 4.2**
 *
 * Property 4: Webhook idempotency
 *   For any Stripe event ID, processing the same event a second time must leave
 *   the database in exactly the same state as after the first processing — no
 *   records are created, updated, or deleted by the duplicate delivery.
 *
 * Implementation:
 *   - First call: prisma.stripeEvent.create succeeds → event is processed normally
 *   - Second call (duplicate): prisma.stripeEvent.create throws a unique constraint
 *     error (P2002) → handler returns 200 immediately without reprocessing
 *   - DB write calls after the first call must be zero on the duplicate
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Module mocks — declared before any imports that use them
// ---------------------------------------------------------------------------

const mockConstructEvent = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

const mockStripeEventCreate = vi.fn();
const mockStripeEventUpdate = vi.fn();
const mockSubscriptionUpsert = vi.fn();
const mockSubscriptionUpdate = vi.fn();
const mockSubscriptionFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockUserFindUnique = vi.fn();
const mockPlanFindFirst = vi.fn();
const mockPlanFindUnique = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stripeEvent: {
      create: mockStripeEventCreate,
      update: mockStripeEventUpdate,
    },
    subscription: {
      upsert: mockSubscriptionUpsert,
      update: mockSubscriptionUpdate,
      findUnique: mockSubscriptionFindUnique,
    },
    user: {
      update: mockUserUpdate,
      findUnique: mockUserFindUnique,
    },
    plan: {
      findFirst: mockPlanFindFirst,
      findUnique: mockPlanFindUnique,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    del: vi.fn().mockResolvedValue(1),
  },
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/webhooks", () => ({
  dispatchWebhook: vi.fn(),
}));

vi.mock("@/lib/resend", () => ({
  sendBillingUpgradeEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBillingReceiptEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBillingPaymentFailedEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBillingDowngradeEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBillingRenewalReminderEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Prisma unique constraint error (P2002) — simulates duplicate event ID */
function makePrismaUniqueError(): Error {
  const err = new Error("Unique constraint failed on the fields: (`id`)");
  (err as Error & { code: string }).code = "P2002";
  return err;
}

/** Build a minimal NextRequest with a stripe-signature header */
function makeWebhookRequest(body: string, sig: string): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": sig,
    },
    body,
  });
}

/** Minimal checkout.session.completed event shape */
function makeCheckoutEvent(eventId: string): object {
  return {
    id: eventId,
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_123",
        client_reference_id: "user_test_123",
        customer: "cus_test_123",
        subscription: "sub_test_123",
        payment_status: "paid",
      },
    },
  };
}

/** Minimal customer.subscription.deleted event shape */
function makeDeletedEvent(eventId: string): object {
  return {
    id: eventId,
    type: "customer.subscription.deleted",
    data: {
      object: {
        id: "sub_test_123",
        customer: "cus_test_123",
        status: "canceled",
        items: { data: [] },
        current_period_start: 1700000000,
        current_period_end: 1702592000,
        cancel_at_period_end: false,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Property 4: Webhook idempotency
// ---------------------------------------------------------------------------

describe("Property 4: Webhook idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
  });

  it(
    "returns 200 on duplicate event without calling any DB write (≥100 iterations)",
    async () => {
      const { POST } = await import("@/app/api/webhooks/stripe/route");

      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary event IDs
          fc.string({ minLength: 5, maxLength: 64 }).filter((s) => s.trim().length > 0),
          async (eventId) => {
            vi.clearAllMocks();

            const event = makeCheckoutEvent(eventId);
            const rawBody = JSON.stringify(event);

            // constructEvent always succeeds
            mockConstructEvent.mockReturnValue(event);

            // First call: stripeEvent.create succeeds
            mockStripeEventCreate.mockResolvedValueOnce({ id: eventId, processed: false });
            // stripe.subscriptions.retrieve needed by handleCheckoutCompleted
            const { stripe: stripeMock } = await import("@/lib/stripe");
            vi.mocked(stripeMock.subscriptions.retrieve).mockResolvedValue({
              id: "sub_test_123",
              items: { data: [{ id: "si_1", price: { id: "price_pro", recurring: { usage_type: "licensed" } } }] },
              cancel_at_period_end: false,
              current_period_start: 1700000000,
              current_period_end: 1702592000,
              trial_end: null,
              status: "active",
            } as never);
            mockUserFindUnique.mockResolvedValue({ id: "user_test_123", email: "test@example.com", locale: "en", plan: "FREE", clerkId: "user_test_123" });
            mockPlanFindUnique.mockResolvedValue({ id: "plan-pro", name: "PRO" });
            mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
            mockSubscriptionUpsert.mockResolvedValue({ userId: "user_test_123", status: "ACTIVE" });
            mockUserUpdate.mockResolvedValue({ id: "user_test_123", plan: "PRO" });
            mockPlanFindFirst.mockResolvedValue({ name: "PRO" });
            mockStripeEventUpdate.mockResolvedValue({ id: eventId, processed: true });

            const req1 = makeWebhookRequest(rawBody, "valid-sig");
            const res1 = await POST(req1);
            expect(res1.status).toBe(200);

            // Capture DB write counts after first call
            const upsertCountAfterFirst = mockSubscriptionUpsert.mock.calls.length;
            const userUpdateCountAfterFirst = mockUserUpdate.mock.calls.length;
            const stripeEventUpdateCountAfterFirst = mockStripeEventUpdate.mock.calls.length;

            // Second call (duplicate): stripeEvent.create throws P2002
            mockConstructEvent.mockReturnValue(event);
            mockStripeEventCreate.mockRejectedValueOnce(makePrismaUniqueError());

            const req2 = makeWebhookRequest(rawBody, "valid-sig");
            const res2 = await POST(req2);

            // Must return 200 silently
            expect(res2.status).toBe(200);

            // No additional DB writes must have occurred
            expect(mockSubscriptionUpsert.mock.calls.length).toBe(upsertCountAfterFirst);
            expect(mockUserUpdate.mock.calls.length).toBe(userUpdateCountAfterFirst);
            expect(mockStripeEventUpdate.mock.calls.length).toBe(stripeEventUpdateCountAfterFirst);
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it("returns 200 on duplicate regardless of event type", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    const eventTypes = [
      "checkout.session.completed",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.payment_failed",
      "invoice.payment_succeeded",
      "customer.subscription.trial_will_end",
    ];

    for (const eventType of eventTypes) {
      vi.clearAllMocks();

      const eventId = `evt_dup_${eventType.replace(/\./g, "_")}`;
      const event = { id: eventId, type: eventType, data: { object: {} } };
      const rawBody = JSON.stringify(event);

      mockConstructEvent.mockReturnValue(event);
      // Duplicate: stripeEvent.create throws immediately
      mockStripeEventCreate.mockRejectedValue(makePrismaUniqueError());

      const req = makeWebhookRequest(rawBody, "valid-sig");
      const res = await POST(req);

      expect(res.status).toBe(200);
      // No business logic writes should occur
      expect(mockSubscriptionUpsert).not.toHaveBeenCalled();
      expect(mockUserUpdate).not.toHaveBeenCalled();
    }
  });

  it("processes the event on first delivery (non-duplicate)", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    vi.clearAllMocks();

    const eventId = "evt_first_delivery_001";
    const event = makeDeletedEvent(eventId);
    const rawBody = JSON.stringify(event);

    mockConstructEvent.mockReturnValue(event);
    // First delivery: create succeeds
    mockStripeEventCreate.mockResolvedValue({ id: eventId, processed: false });
    mockSubscriptionFindUnique.mockResolvedValue({
      id: "sub-db-id",
      userId: "user_test_123",
      stripeSubscriptionId: "sub_test_123",
      status: "ACTIVE",
      user: { id: "user_test_123", email: "test@example.com", plan: "PRO" },
    });
    mockPlanFindUnique.mockResolvedValue({ id: "plan-free", name: "FREE" });
    mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
    mockSubscriptionUpdate.mockResolvedValue({ status: "CANCELED" });
    mockUserUpdate.mockResolvedValue({ plan: "FREE" });
    mockUserFindUnique.mockResolvedValue({ id: "user_test_123", email: "test@example.com", locale: "en" });
    mockPlanFindFirst.mockResolvedValue({ name: "FREE" });
    mockStripeEventUpdate.mockResolvedValue({ id: eventId, processed: true });

    const req = makeWebhookRequest(rawBody, "valid-sig");
    const res = await POST(req);

    expect(res.status).toBe(200);
    // StripeEvent must be marked processed: true after first delivery
    expect(mockStripeEventUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: eventId },
        data: { processed: true },
      }),
    );
  });

  it(
    "DB state is identical after first and second delivery for any event ID (≥100 iterations)",
    async () => {
      const { POST } = await import("@/app/api/webhooks/stripe/route");

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 64 }).filter((s) => s.trim().length > 0),
          async (eventId) => {
            vi.clearAllMocks();

            const event = makeDeletedEvent(eventId);
            const rawBody = JSON.stringify(event);

            mockConstructEvent.mockReturnValue(event);

            // First delivery
            mockStripeEventCreate.mockResolvedValueOnce({ id: eventId, processed: false });
            mockSubscriptionFindUnique.mockResolvedValue({
              id: "sub-db-id",
              userId: "user_test_123",
              stripeSubscriptionId: "sub_test_123",
              status: "ACTIVE",
              user: { id: "user_test_123", email: "test@example.com", plan: "PRO" },
            });
            mockPlanFindUnique.mockResolvedValue({ id: "plan-free", name: "FREE" });
            mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
            mockSubscriptionUpdate.mockResolvedValue({ status: "CANCELED" });
            mockUserUpdate.mockResolvedValue({ plan: "FREE" });
            mockUserFindUnique.mockResolvedValue({ id: "user_test_123", email: "test@example.com", locale: "en" });
            mockPlanFindFirst.mockResolvedValue({ name: "FREE" });
            mockStripeEventUpdate.mockResolvedValue({ id: eventId, processed: true });

            await POST(makeWebhookRequest(rawBody, "valid-sig"));

            // Snapshot DB call counts after first delivery
            const snapshot = {
              subscriptionUpdate: mockSubscriptionUpdate.mock.calls.length,
              userUpdate: mockUserUpdate.mock.calls.length,
              stripeEventUpdate: mockStripeEventUpdate.mock.calls.length,
            };

            // Second delivery (duplicate)
            mockConstructEvent.mockReturnValue(event);
            mockStripeEventCreate.mockRejectedValueOnce(makePrismaUniqueError());

            await POST(makeWebhookRequest(rawBody, "valid-sig"));

            // Counts must not have changed
            expect(mockSubscriptionUpdate.mock.calls.length).toBe(snapshot.subscriptionUpdate);
            expect(mockUserUpdate.mock.calls.length).toBe(snapshot.userUpdate);
            expect(mockStripeEventUpdate.mock.calls.length).toBe(snapshot.stripeEventUpdate);
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
