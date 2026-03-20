/**
 * Property-Based Tests for Webhook DB State Correctness
 * Validates: Requirements 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 *
 * Property 5: Webhook event produces correct DB state
 * Property 12: StripeEvent record lifecycle
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

function makeRequest(body: object, sig = "valid-sig"): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": sig },
    body: JSON.stringify(body),
  });
}

type StripeStatus = "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "paused";

function makeStripeSub(subId: string, status: StripeStatus, priceId = "price_pro_monthly") {
  return {
    id: subId,
    status,
    customer: "cus_test_123",
    items: { data: [{ id: "si_123", price: { id: priceId, recurring: { usage_type: "licensed" } } }] },
    current_period_start: 1700000000,
    current_period_end: 1702592000,
    cancel_at_period_end: false,
    cancel_at: null as number | null,
    trial_end: null as number | null,
  };
}

function setupBase(eventId: string) {
  mockStripeEventCreate.mockResolvedValue({ id: eventId, processed: false });
  mockStripeEventUpdate.mockResolvedValue({ id: eventId, processed: true });
  mockUserFindUnique.mockResolvedValue({ id: "u1", clerkId: "clerk_u1", email: "t@t.com", plan: "FREE", metadata: {} });
  mockPlanFindUnique.mockResolvedValue({ id: "plan-pro", name: "PRO" });
  mockPlanFindFirst.mockResolvedValue({ id: "plan-free", name: "FREE" });
  mockSubscriptionUpdate.mockResolvedValue({ id: "sub-db" });
  mockSubscriptionUpsert.mockResolvedValue({ id: "sub-db" });
  mockUserUpdate.mockResolvedValue({ id: "u1" });
  mockTransaction.mockImplementation(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[]));
}


// ---------------------------------------------------------------------------
// Property 5: Webhook event produces correct DB state
// ---------------------------------------------------------------------------

describe("Property 5: Webhook event produces correct DB state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.STRIPE_PRO_PRICE_ID = "price_pro_monthly";
    process.env.STRIPE_TEAM_PRICE_ID = "price_team_monthly";
    process.env.STRIPE_PRO_PRICE_ID_YEARLY = "price_pro_yearly";
    process.env.STRIPE_TEAM_PRICE_ID_YEARLY = "price_team_yearly";
  });

  it(
    "customer.subscription.deleted always sets User.plan = FREE regardless of prior plan (>=100 iterations)",
    async () => {
      const { POST } = await import("@/app/api/webhooks/stripe/route");

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom("PRO", "TEAM", "ENTERPRISE"),
          fc.string({ minLength: 5, maxLength: 40 }).filter((s) => /\S/.test(s)),
          async (currentPlan, eventId) => {
            vi.clearAllMocks();
            setupBase(eventId);

            const subId = "sub_" + eventId.slice(0, 10);
            const event = {
              id: eventId,
              type: "customer.subscription.deleted",
              data: { object: makeStripeSub(subId, "canceled") },
            };

            mockConstructEvent.mockReturnValue(event);
            mockUserFindUnique.mockResolvedValue({ id: "u1", clerkId: "clerk_u1", email: "t@t.com", plan: currentPlan, metadata: {} });
            mockSubscriptionFindUnique.mockResolvedValue({
              id: "sub-db",
              userId: "u1",
              stripeSubscriptionId: subId,
              status: "ACTIVE",
              cancelAtPeriodEnd: false,
              user: { id: "u1", plan: currentPlan, email: "t@t.com", metadata: {} },
            });
            mockPlanFindUnique.mockResolvedValue({ id: "plan-free", name: "FREE" });
            mockTransaction.mockImplementation(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[]));

            let capturedPlan: string | null = null;
            mockUserUpdate.mockImplementation(async (args: { data?: { plan?: string } }) => {
              if (args?.data?.plan !== undefined) capturedPlan = args.data.plan;
              return { id: "u1" };
            });
            mockSubscriptionUpdate.mockResolvedValue({ id: "sub-db" });

            const res = await POST(makeRequest(event));
            expect(res.status).toBe(200);
            expect(capturedPlan).toBe("FREE");
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    "invoice.payment_failed sets Subscription.status to PAST_DUE (>=100 iterations)",
    async () => {
      const { POST } = await import("@/app/api/webhooks/stripe/route");

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 40 }).filter((s) => /\S/.test(s)),
          async (eventId) => {
            vi.clearAllMocks();
            setupBase(eventId);

            const subId = "sub_" + eventId.slice(0, 10);
            const event = {
              id: eventId,
              type: "invoice.payment_failed",
              data: {
                object: {
                  id: "in_" + eventId.slice(0, 10),
                  parent: { subscription_details: { subscription: subId } },
                  amount_due: 2900,
                  currency: "eur",
                },
              },
            };

            mockConstructEvent.mockReturnValue(event);
            mockSubscriptionFindUnique.mockResolvedValue({ id: "sub-db", userId: "u1", stripeSubscriptionId: subId, status: "ACTIVE" });
            mockUserFindUnique.mockResolvedValue({ id: "u1", email: "t@t.com", metadata: {} });

            let capturedStatus: string | null = null;
            mockSubscriptionUpdate.mockImplementation(async (args: { data?: { status?: string } }) => {
              if (args?.data?.status) capturedStatus = args.data.status;
              return { id: "sub-db" };
            });

            const res = await POST(makeRequest(event));
            expect(res.status).toBe(200);
            expect(capturedStatus).toBe("PAST_DUE");
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it("checkout.session.completed sets Subscription.status=ACTIVE and User.plan=PRO", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    vi.clearAllMocks();
    const eventId = "evt_checkout_001";
    setupBase(eventId);

    const stripeSub = makeStripeSub("sub_checkout_001", "active");
    mockStripeSubscriptionsRetrieve.mockResolvedValue(stripeSub);
    mockPlanFindFirst.mockResolvedValue({ id: "plan-pro", name: "PRO" });
    mockPlanFindUnique.mockResolvedValue({ id: "plan-pro", name: "PRO" });

    const event = {
      id: eventId,
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_001",
          client_reference_id: "clerk_u1",
          customer: "cus_123",
          subscription: "sub_checkout_001",
          payment_status: "paid",
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    let capturedSubStatus: string | null = null;
    let capturedUserPlan: string | null = null;
    mockSubscriptionUpsert.mockImplementation(async (args: { update?: { status?: string } }) => {
      if (args?.update?.status) capturedSubStatus = args.update.status;
      return { id: "sub-db" };
    });
    mockUserUpdate.mockImplementation(async (args: { data?: { plan?: string } }) => {
      if (args?.data?.plan) capturedUserPlan = args.data.plan;
      return { id: "u1" };
    });
    mockTransaction.mockImplementation(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[]));

    const res = await POST(makeRequest(event));
    expect(res.status).toBe(200);
    expect(capturedSubStatus).toBe("ACTIVE");
    expect(capturedUserPlan).toBe("PRO");
  });

  it("customer.subscription.updated with status=trialing sets TRIALING and User.plan=PRO", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    vi.clearAllMocks();
    const eventId = "evt_trialing_001";
    setupBase(eventId);

    const stripeSub = makeStripeSub("sub_trial_001", "trialing");
    stripeSub.trial_end = 1705000000;

    const event = {
      id: eventId,
      type: "customer.subscription.updated",
      data: { object: stripeSub },
    };
    mockConstructEvent.mockReturnValue(event);
    mockPlanFindFirst.mockResolvedValue({ id: "plan-pro", name: "PRO" });
    mockPlanFindUnique.mockResolvedValue({ id: "plan-pro", name: "PRO" });
    mockSubscriptionFindUnique.mockResolvedValue({
      id: "sub-db",
      userId: "u1",
      stripeSubscriptionId: "sub_trial_001",
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      user: { id: "u1", plan: "FREE", email: "t@t.com", metadata: {} },
    });

    let capturedStatus: string | null = null;
    let capturedPlan: string | null = null;
    mockSubscriptionUpdate.mockImplementation(async (args: { data?: { status?: string } }) => {
      if (args?.data?.status) capturedStatus = args.data.status;
      return { id: "sub-db" };
    });
    mockUserUpdate.mockImplementation(async (args: { data?: { plan?: string } }) => {
      if (args?.data?.plan) capturedPlan = args.data.plan;
      return { id: "u1" };
    });
    mockTransaction.mockImplementation(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[]));

    const res = await POST(makeRequest(event));
    expect(res.status).toBe(200);
    expect(capturedStatus).toBe("TRIALING");
    expect(capturedPlan).toBe("PRO");
  });
});


// ---------------------------------------------------------------------------
// Property 12: StripeEvent record lifecycle
// ---------------------------------------------------------------------------

describe("Property 12: StripeEvent record lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  it(
    "StripeEvent created with processed:false before business logic, updated to processed:true on success (>=100 iterations)",
    async () => {
      const { POST } = await import("@/app/api/webhooks/stripe/route");

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 40 }).filter((s) => s.trim().length > 0),
          async (eventId) => {
            vi.clearAllMocks();

            const event = {
              id: eventId,
              type: "customer.subscription.trial_will_end",
              data: {
                object: {
                  id: "sub_" + eventId.slice(0, 8),
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

            mockConstructEvent.mockReturnValue(event);

            const callOrder: string[] = [];

            mockStripeEventCreate.mockImplementation(async () => {
              callOrder.push("create");
              return { id: eventId, processed: false };
            });
            mockSubscriptionFindUnique.mockImplementation(async () => {
              callOrder.push("findUnique");
              return { id: "sub-db", userId: "u1", stripeSubscriptionId: "sub_" + eventId.slice(0, 8) };
            });
            mockStripeEventUpdate.mockImplementation(async () => {
              callOrder.push("update");
              return { id: eventId, processed: true };
            });
            mockUserFindUnique.mockResolvedValue({ id: "u1", email: "t@t.com", locale: "en" });

            const res = await POST(makeRequest(event));
            expect(res.status).toBe(200);

            const createIdx = callOrder.indexOf("create");
            const findIdx = callOrder.indexOf("findUnique");
            const updateIdx = callOrder.indexOf("update");

            expect(createIdx).toBeGreaterThanOrEqual(0);
            expect(updateIdx).toBeGreaterThanOrEqual(0);
            if (findIdx >= 0) expect(createIdx).toBeLessThan(findIdx);
            expect(updateIdx).toBeGreaterThan(createIdx);

            expect(mockStripeEventUpdate).toHaveBeenCalledWith(
              expect.objectContaining({ where: { id: eventId }, data: { processed: true } }),
            );
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    "StripeEvent.error is populated and processed:true is NOT set when processing throws (>=100 iterations)",
    async () => {
      const { POST } = await import("@/app/api/webhooks/stripe/route");

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 40 }).filter((s) => /\S/.test(s)),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (eventId, errorMessage) => {
            vi.clearAllMocks();

            const subId = "sub_" + eventId.slice(0, 8);
            const event = {
              id: eventId,
              type: "customer.subscription.deleted",
              data: {
                object: {
                  id: subId,
                  status: "canceled",
                  customer: "cus_123",
                  items: { data: [] },
                  current_period_start: 1700000000,
                  current_period_end: 1702592000,
                  cancel_at_period_end: false,
                  cancel_at: null,
                  trial_end: null,
                },
              },
            };

            mockConstructEvent.mockReturnValue(event);
            mockStripeEventCreate.mockResolvedValue({ id: eventId, processed: false });
            mockSubscriptionFindUnique.mockRejectedValue(new Error(errorMessage));

            let capturedErrorData: Record<string, unknown> | null = null;
            mockStripeEventUpdate.mockImplementation(async (args: { data?: Record<string, unknown> }) => {
              capturedErrorData = args?.data ?? null;
              return { id: eventId };
            });

            const res = await POST(makeRequest(event));
            expect(res.status).toBe(500);

            expect(capturedErrorData).not.toBeNull();
            expect(capturedErrorData?.["error"]).toBeTruthy();
            expect(typeof capturedErrorData?.["error"]).toBe("string");

            const processedTrueCall = mockStripeEventUpdate.mock.calls.find(
              (call) => (call[0] as { data?: { processed?: boolean } })?.data?.processed === true,
            );
            expect(processedTrueCall).toBeUndefined();
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it("StripeEvent.create is called with the correct event ID and processed:false", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    vi.clearAllMocks();
    const eventId = "evt_lifecycle_001";

    const event = {
      id: eventId,
      type: "customer.subscription.trial_will_end",
      data: {
        object: {
          id: "sub_lifecycle_001",
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

    mockConstructEvent.mockReturnValue(event);
    mockStripeEventCreate.mockResolvedValue({ id: eventId, processed: false });
    mockStripeEventUpdate.mockResolvedValue({ id: eventId, processed: true });
    mockSubscriptionFindUnique.mockResolvedValue({ id: "sub-db", userId: "u1", stripeSubscriptionId: "sub_lifecycle_001" });
    mockUserFindUnique.mockResolvedValue({ id: "u1", email: "t@t.com", locale: "en" });

    await POST(makeRequest(event));

    expect(mockStripeEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ id: eventId, processed: false }) }),
    );
  });
});
