/**
 * Property-Based Tests: Plan Downgrade — No Auto-Delete
 * Validates: Requirement 7.5
 *
 * Property 11: No auto-delete on plan downgrade
 *   After customer.subscription.deleted fires, all Project, ApiKey, and Webhook
 *   records belonging to the user must still exist in the DB. GateCtr downgrades
 *   the plan but never deletes user data automatically.
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
const mockProjectDelete = vi.fn();
const mockApiKeyDelete = vi.fn();
const mockWebhookDelete = vi.fn();
const mockProjectDeleteMany = vi.fn();
const mockApiKeyDeleteMany = vi.fn();
const mockWebhookDeleteMany = vi.fn();
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
    project: { delete: mockProjectDelete, deleteMany: mockProjectDeleteMany },
    apiKey: { delete: mockApiKeyDelete, deleteMany: mockApiKeyDeleteMany },
    webhook: { delete: mockWebhookDelete, deleteMany: mockWebhookDeleteMany },
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

function makeDeletedSubscriptionEvent(
  subscriptionId: string,
  customerId: string,
) {
  return {
    id: `evt_del_${subscriptionId}`,
    type: "customer.subscription.deleted",
    data: {
      object: {
        id: subscriptionId,
        customer: customerId,
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
}

function makeRequest(event: object): NextRequest {
  const body = JSON.stringify(event);
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": "v1,valid_sig",
    },
    body,
  });
}

// ---------------------------------------------------------------------------
// Property 11: No auto-delete on plan downgrade
// ---------------------------------------------------------------------------

describe("Property 11: No auto-delete on plan downgrade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
  });

  it("never calls project/apiKey/webhook delete after subscription.deleted (>=100 iterations)", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 30 }).map((s) => `sub_${s}`),
        fc.string({ minLength: 5, maxLength: 30 }).map((s) => `cus_${s}`),
        fc.string({ minLength: 5, maxLength: 30 }).map((s) => `user_${s}`),
        async (subscriptionId, customerId, userId) => {
          vi.clearAllMocks();

          const event = makeDeletedSubscriptionEvent(
            subscriptionId,
            customerId,
          );

          // Valid signature — constructEvent succeeds
          mockConstructEvent.mockReturnValue(event);
          mockStripeEventCreate.mockResolvedValue({
            id: event.id,
            processed: false,
          });
          mockStripeEventUpdate.mockResolvedValue({
            id: event.id,
            processed: true,
          });
          mockSubscriptionFindUnique.mockResolvedValue({
            id: "sub-db-id",
            userId,
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            user: { id: userId, email: "user@example.com", plan: "PRO" },
          });
          mockPlanFindUnique.mockResolvedValue({
            id: "plan-free",
            name: "FREE",
          });
          // $transaction executes the array of prisma calls — resolve them
          mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) =>
            Promise.all(ops),
          );
          mockSubscriptionUpdate.mockResolvedValue({
            id: "sub-db-id",
            status: "CANCELED",
          });
          mockUserUpdate.mockResolvedValue({ id: userId, plan: "FREE" });
          mockUserFindUnique.mockResolvedValue({
            id: userId,
            email: "user@example.com",
            locale: "en",
            plan: "PRO",
          });

          const req = makeRequest(event);
          const res = await POST(req);

          // Handler must succeed
          expect(res.status).toBe(200);

          // CRITICAL: must never delete user data
          expect(mockProjectDelete).not.toHaveBeenCalled();
          expect(mockProjectDeleteMany).not.toHaveBeenCalled();
          expect(mockApiKeyDelete).not.toHaveBeenCalled();
          expect(mockApiKeyDeleteMany).not.toHaveBeenCalled();
          expect(mockWebhookDelete).not.toHaveBeenCalled();
          expect(mockWebhookDeleteMany).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("downgrades User.plan to FREE after subscription.deleted", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    vi.clearAllMocks();

    const event = makeDeletedSubscriptionEvent(
      "sub_downgrade_001",
      "cus_downgrade_001",
    );
    mockConstructEvent.mockReturnValue(event);
    mockStripeEventCreate.mockResolvedValue({ id: event.id, processed: false });
    mockStripeEventUpdate.mockResolvedValue({ id: event.id, processed: true });
    mockSubscriptionFindUnique.mockResolvedValue({
      id: "sub-db-id",
      userId: "user_downgrade_001",
      stripeSubscriptionId: "sub_downgrade_001",
      user: {
        id: "user_downgrade_001",
        email: "user@example.com",
        plan: "TEAM",
      },
    });
    mockPlanFindUnique.mockResolvedValue({ id: "plan-free", name: "FREE" });
    mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops),
    );
    mockSubscriptionUpdate.mockResolvedValue({
      id: "sub-db-id",
      status: "CANCELED",
    });
    mockUserFindUnique.mockResolvedValue({
      id: "user_downgrade_001",
      email: "user@example.com",
      locale: "en",
      plan: "TEAM",
    });
    mockUserUpdate.mockResolvedValue({
      id: "user_downgrade_001",
      plan: "FREE",
    });

    const req = makeRequest(event);
    const res = await POST(req);

    expect(res.status).toBe(200);

    // At minimum, userUpdate was called (plan downgrade happened)
    expect(mockUserUpdate).toHaveBeenCalled();

    // No data deletion
    expect(mockProjectDeleteMany).not.toHaveBeenCalled();
    expect(mockApiKeyDeleteMany).not.toHaveBeenCalled();
    expect(mockWebhookDeleteMany).not.toHaveBeenCalled();
  });

  it("sets Subscription.status to CANCELED after subscription.deleted", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    vi.clearAllMocks();

    const event = makeDeletedSubscriptionEvent(
      "sub_cancel_002",
      "cus_cancel_002",
    );
    mockConstructEvent.mockReturnValue(event);
    mockStripeEventCreate.mockResolvedValue({ id: event.id, processed: false });
    mockStripeEventUpdate.mockResolvedValue({ id: event.id, processed: true });
    mockSubscriptionFindUnique.mockResolvedValue({
      id: "sub-db-id",
      userId: "user_cancel_002",
      stripeSubscriptionId: "sub_cancel_002",
      user: { id: "user_cancel_002", email: "user@example.com", plan: "PRO" },
    });
    mockPlanFindUnique.mockResolvedValue({ id: "plan-free", name: "FREE" });
    mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops),
    );
    mockSubscriptionUpdate.mockResolvedValue({
      id: "sub-db-id",
      status: "CANCELED",
    });
    mockUserFindUnique.mockResolvedValue({
      id: "user_cancel_002",
      email: "user@example.com",
      locale: "en",
      plan: "PRO",
    });
    mockUserUpdate.mockResolvedValue({ id: "user_cancel_002", plan: "FREE" });

    const req = makeRequest(event);
    const res = await POST(req);

    expect(res.status).toBe(200);

    // Subscription must be updated to CANCELED
    expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CANCELED" }),
      }),
    );
  });
});
