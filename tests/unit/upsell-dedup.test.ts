/**
 * Property-Based Tests: Upsell Dedup via Redis
 * Validates: Requirement 12.3
 *
 * Property 16: Upsell dedup via Redis
 *   For any user who has already been shown an upsell for a given quota type
 *   today (Redis key exists), getUpsellState must return { show: false }.
 *   On the first hit (Redis key absent), it must return { show: true }.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

const mockUserFindUnique = vi.fn();
const mockDailyUsageAggregate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    dailyUsageCache: { aggregate: mockDailyUsageAggregate },
  },
}));

const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();

vi.mock("@/lib/redis", () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
  },
}));

const mockGetPlanLimits = vi.fn();

vi.mock("@/lib/plan-guard", () => ({
  getPlanLimits: mockGetPlanLimits,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFreeLimits(overrides: Record<string, unknown> = {}) {
  return {
    maxTokensPerMonth: 50_000,
    maxRequestsPerDay: 1_000,
    contextOptimizerEnabled: false,
    modelRouterEnabled: false,
    advancedAnalytics: false,
    auditLogsRetentionDays: 0,
    ...overrides,
  };
}

function makeProLimits(overrides: Record<string, unknown> = {}) {
  return {
    maxTokensPerMonth: 2_000_000,
    maxRequestsPerDay: 60_000,
    contextOptimizerEnabled: true,
    modelRouterEnabled: true,
    advancedAnalytics: true,
    auditLogsRetentionDays: 30,
    ...overrides,
  };
}

async function setupAuth(clerkId: string) {
  const { auth } = await import("@clerk/nextjs/server");
  vi.mocked(auth).mockResolvedValue({ userId: clerkId } as never);
}

// ---------------------------------------------------------------------------
// Property 16: Upsell dedup via Redis
// ---------------------------------------------------------------------------

describe("Property 16: Upsell dedup via Redis", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns show:false when Redis dedup key already exists (>=100 iterations)", async () => {
    const { getUpsellState } =
      await import("@/app/[locale]/(dashboard)/billing/_actions");

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        // usage >= 80% of limit to trigger upsell check
        fc.integer({ min: 40_000, max: 50_000 }), // 80–100% of 50K FREE limit
        async (clerkId, userId, tokensUsed) => {
          vi.clearAllMocks();
          await setupAuth(clerkId);

          mockUserFindUnique.mockResolvedValue({
            id: userId,
            plan: "FREE",
            clerkId,
          });

          // Current plan limits (FREE)
          mockGetPlanLimits.mockImplementation(async (plan: string) => {
            if (plan === "FREE") return makeFreeLimits();
            if (plan === "PRO") return makeProLimits();
            return null;
          });

          // Usage is >= 80% of limit
          mockDailyUsageAggregate.mockResolvedValue({
            _sum: { totalTokens: tokensUsed, totalRequests: 0 },
          });

          // Redis key already exists → SET NX returns null (key not set)
          mockRedisSet.mockResolvedValue(null);

          const result = await getUpsellState();

          // Must not show upsell — already shown today
          expect(result.show).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("returns show:true on first hit when Redis key is absent (>=100 iterations)", async () => {
    const { getUpsellState } =
      await import("@/app/[locale]/(dashboard)/billing/_actions");

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.integer({ min: 40_000, max: 50_000 }),
        async (clerkId, userId, tokensUsed) => {
          vi.clearAllMocks();
          await setupAuth(clerkId);

          mockUserFindUnique.mockResolvedValue({
            id: userId,
            plan: "FREE",
            clerkId,
          });

          mockGetPlanLimits.mockImplementation(async (plan: string) => {
            if (plan === "FREE") return makeFreeLimits();
            if (plan === "PRO") return makeProLimits();
            return null;
          });

          mockDailyUsageAggregate.mockResolvedValue({
            _sum: { totalTokens: tokensUsed, totalRequests: 0 },
          });

          // Redis key absent → SET NX returns "OK" (key was set — first hit)
          mockRedisSet.mockResolvedValue("OK");

          const result = await getUpsellState();

          // Must show upsell on first hit
          expect(result.show).toBe(true);
          if (result.show) {
            expect(result.percentUsed).toBeGreaterThanOrEqual(80);
            expect(result.nextPlan).toBe("PRO");
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Redis SET is called with nx:true and ex:86400 for dedup key (>=100 iterations)", async () => {
    const { getUpsellState } =
      await import("@/app/[locale]/(dashboard)/billing/_actions");

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        async (clerkId, userId) => {
          vi.clearAllMocks();
          await setupAuth(clerkId);

          mockUserFindUnique.mockResolvedValue({
            id: userId,
            plan: "FREE",
            clerkId,
          });
          mockGetPlanLimits.mockImplementation(async (plan: string) => {
            if (plan === "FREE") return makeFreeLimits();
            if (plan === "PRO") return makeProLimits();
            return null;
          });
          // 90% usage — definitely triggers upsell path
          mockDailyUsageAggregate.mockResolvedValue({
            _sum: { totalTokens: 45_000, totalRequests: 0 },
          });
          mockRedisSet.mockResolvedValue("OK");

          await getUpsellState();

          // Verify SET was called with correct dedup options
          const escapedUserId = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          expect(mockRedisSet).toHaveBeenCalledWith(
            expect.stringMatching(new RegExp(`^upsell:${escapedUserId}:`)),
            "1",
            expect.objectContaining({ nx: true, ex: 86400 }),
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("returns show:false when user is not authenticated", async () => {
    const { getUpsellState } =
      await import("@/app/[locale]/(dashboard)/billing/_actions");
    vi.clearAllMocks();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const result = await getUpsellState();
    expect(result.show).toBe(false);
  });

  it("returns show:false for ENTERPRISE plan (no next plan)", async () => {
    const { getUpsellState } =
      await import("@/app/[locale]/(dashboard)/billing/_actions");
    vi.clearAllMocks();

    await setupAuth("clerk_enterprise");
    mockUserFindUnique.mockResolvedValue({
      id: "user_enterprise",
      plan: "ENTERPRISE",
      clerkId: "clerk_enterprise",
    });
    mockGetPlanLimits.mockResolvedValue(null);

    const result = await getUpsellState();
    expect(result.show).toBe(false);
  });

  it("returns show:false when usage is below 80% threshold", async () => {
    const { getUpsellState } =
      await import("@/app/[locale]/(dashboard)/billing/_actions");
    vi.clearAllMocks();

    await setupAuth("clerk_low_usage");
    mockUserFindUnique.mockResolvedValue({
      id: "user_low",
      plan: "FREE",
      clerkId: "clerk_low_usage",
    });
    mockGetPlanLimits.mockImplementation(async (plan: string) => {
      if (plan === "FREE") return makeFreeLimits();
      if (plan === "PRO") return makeProLimits();
      return null;
    });
    // 50% usage — below threshold
    mockDailyUsageAggregate.mockResolvedValue({
      _sum: { totalTokens: 25_000, totalRequests: 0 },
    });

    const result = await getUpsellState();
    expect(result.show).toBe(false);
  });
});
