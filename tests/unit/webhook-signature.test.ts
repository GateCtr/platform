/**
 * Property-Based Tests for Webhook Signature Rejection
 * Validates: Requirements 4.1, 9.2
 *
 * Property 9: Webhook signature rejection
 *   For any request body and any absent or invalid stripe-signature header,
 *   the webhook handler must return HTTP 400 and must not write any record
 *   to the StripeEvent table or any other table.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockConstructEvent = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: vi.fn() },
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
    user: { update: mockUserUpdate, findUnique: mockUserFindUnique },
    plan: { findFirst: mockPlanFindFirst, findUnique: mockPlanFindUnique },
    $transaction: mockTransaction,
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: { del: vi.fn().mockResolvedValue(1) },
}));
vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/webhooks", () => ({ dispatchWebhook: vi.fn() }));
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

function makeRequest(body: string, sig: string | null): NextRequest {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (sig !== null) headers["stripe-signature"] = sig;
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers,
    body,
  });
}

// ---------------------------------------------------------------------------
// Property 9: Webhook signature rejection
// ---------------------------------------------------------------------------

describe("Property 9: Webhook signature rejection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
    // constructEvent always throws for invalid signatures
    mockConstructEvent.mockImplementation(() => {
      throw new Error(
        "No signatures found matching the expected signature for payload",
      );
    });
  });

  it("returns 400 for any invalid stripe-signature header value (>=100 iterations)", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    await fc.assert(
      fc.asyncProperty(
        // Arbitrary request bodies
        fc.oneof(
          fc.string(),
          fc.constant("{}"),
          fc.constant('{"id":"evt_test","type":"checkout.session.completed"}'),
        ),
        // Arbitrary non-empty signature strings (all invalid — constructEvent throws)
        fc.string({ minLength: 1, maxLength: 200 }),
        async (body, invalidSig) => {
          mockConstructEvent.mockClear();
          mockStripeEventCreate.mockClear();
          mockSubscriptionUpsert.mockClear();
          mockSubscriptionUpdate.mockClear();
          mockUserUpdate.mockClear();
          mockTransaction.mockClear();

          const req = makeRequest(body, invalidSig);
          const res = await POST(req);

          // Must return 400
          expect(res.status).toBe(400);

          // Must not write any DB records
          expect(mockStripeEventCreate).not.toHaveBeenCalled();
          expect(mockSubscriptionUpsert).not.toHaveBeenCalled();
          expect(mockSubscriptionUpdate).not.toHaveBeenCalled();
          expect(mockUserUpdate).not.toHaveBeenCalled();
          expect(mockTransaction).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("returns 400 when stripe-signature header is absent (>=100 iterations)", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string(),
          fc.constant("{}"),
          fc.constant('{"id":"evt_test","type":"invoice.payment_failed"}'),
        ),
        async (body) => {
          mockStripeEventCreate.mockClear();
          mockSubscriptionUpdate.mockClear();
          mockUserUpdate.mockClear();

          // No stripe-signature header
          const req = makeRequest(body, null);
          const res = await POST(req);

          expect(res.status).toBe(400);
          expect(mockStripeEventCreate).not.toHaveBeenCalled();
          expect(mockSubscriptionUpdate).not.toHaveBeenCalled();
          expect(mockUserUpdate).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("returns 400 with an error field in the response body on invalid signature", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    const req = makeRequest('{"id":"evt_test"}', "v1,invalid_signature");
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(typeof body.error).toBe("string");
  });

  it("returns 400 with an error field when signature header is missing", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    const req = makeRequest('{"id":"evt_test"}', null);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("does NOT call constructEvent when stripe-signature header is absent (>=100 iterations)", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    await fc.assert(
      fc.asyncProperty(fc.string(), async (body) => {
        mockConstructEvent.mockClear();

        const req = makeRequest(body, null);
        await POST(req);

        // Handler must short-circuit before calling constructEvent
        // when the header is missing
        expect(mockConstructEvent).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });

  it("processes event normally when signature is valid (control case)", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    vi.clearAllMocks();

    const eventId = "evt_valid_sig_control";
    const event = {
      id: eventId,
      type: "customer.subscription.trial_will_end",
      data: {
        object: {
          id: "sub_control_001",
          status: "trialing",
          trial_end: 1705000000,
          items: { data: [] },
          current_period_start: 1700000000,
          current_period_end: 1702592000,
          cancel_at_period_end: false,
          cancel_at: null,
        },
      },
    };

    // Valid signature: constructEvent succeeds
    mockConstructEvent.mockReturnValue(event);
    mockStripeEventCreate.mockResolvedValue({ id: eventId, processed: false });
    mockStripeEventUpdate.mockResolvedValue({ id: eventId, processed: true });
    mockSubscriptionFindUnique.mockResolvedValue({
      id: "sub-db",
      userId: "u1",
      stripeSubscriptionId: "sub_control_001",
    });
    mockUserFindUnique.mockResolvedValue({
      id: "u1",
      email: "t@t.com",
      locale: "en",
    });

    const req = makeRequest(JSON.stringify(event), "v1,valid_signature");
    const res = await POST(req);

    // Valid signature must NOT return 400
    expect(res.status).not.toBe(400);
    expect(res.status).toBe(200);
  });
});
