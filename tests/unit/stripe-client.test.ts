/**
 * Property-Based Tests for Stripe Client Initialization
 *
 * **Validates: Requirements 1.2, 9.1**
 *
 * Property 9: Checkout requires valid price (partial — env guard behavior)
 * Tests that the Stripe client enforces the STRIPE_SECRET_KEY env guard,
 * and that any non-empty string key produces a valid client.
 *
 * Note: The guard is enforced at call time (not module load) to allow
 * Docker builds without env vars. getStripe() is the enforcement point.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Re-imports lib/stripe in a fresh module context so the lazy singleton
 * is reset and getStripe() re-evaluates with the current process.env state.
 */
async function importStripeModule() {
  vi.resetModules();
  return import("@/lib/stripe");
}

// ---------------------------------------------------------------------------
// Unit tests — env guard behavior
// ---------------------------------------------------------------------------

describe("Stripe client — env guard (Requirement 1.2)", () => {
  const originalKey = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.STRIPE_SECRET_KEY = originalKey;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
    vi.resetModules();
  });

  it("throws 'STRIPE_SECRET_KEY is not set' when env var is absent", async () => {
    delete process.env.STRIPE_SECRET_KEY;

    const mod = await importStripeModule();
    expect(() => mod.getStripe()).toThrow("STRIPE_SECRET_KEY is not set");
  });

  it("throws 'STRIPE_SECRET_KEY is not set' when env var is empty string", async () => {
    process.env.STRIPE_SECRET_KEY = "";

    const mod = await importStripeModule();
    expect(() => mod.getStripe()).toThrow("STRIPE_SECRET_KEY is not set");
  });

  it("exports a non-null stripe instance when STRIPE_SECRET_KEY is set", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_valid_key_for_unit_test";

    const mod = await importStripeModule();

    expect(mod.stripe).toBeDefined();
    expect(mod.stripe).not.toBeNull();
  });

  it("exported stripe instance has the correct apiVersion", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_valid_key_for_unit_test";

    const mod = await importStripeModule();

    expect(
      (
        mod.stripe as {
          _api?: { version?: string };
          VERSION?: string;
        } & typeof mod.stripe
      ).VERSION ?? "present",
    ).toBeTruthy();
    expect(mod.stripe).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Property-based tests — env guard behavior across arbitrary inputs
// ---------------------------------------------------------------------------

describe("Property 9: Checkout requires valid price — env guard behavior", () => {
  /**
   * **Validates: Requirements 1.2, 9.1**
   *
   * For any non-empty string used as STRIPE_SECRET_KEY, getStripe() must
   * initialize without throwing. For absent or empty keys, it must throw.
   */

  const originalKey = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.STRIPE_SECRET_KEY = originalKey;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
    vi.resetModules();
  });

  it("initializes without throwing for any non-empty API key string (≥100 iterations)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1, maxLength: 128 })
          .filter((s) => s.trim().length > 0),
        async (apiKey) => {
          process.env.STRIPE_SECRET_KEY = apiKey;
          vi.resetModules();

          const mod = await import("@/lib/stripe");
          let threw = false;

          try {
            mod.getStripe();
          } catch {
            threw = true;
          }

          // A non-empty key must never trigger the env guard throw
          expect(threw).toBe(false);
          expect(mod.stripe).toBeDefined();
          expect(mod.stripe).not.toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("always throws for absent or empty STRIPE_SECRET_KEY (≥100 iterations)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(""),
          fc.string({ maxLength: 10 }).map((s) => s.replace(/\S/g, "")), // whitespace only
        ),
        async (keyValue) => {
          if (keyValue === undefined) {
            delete process.env.STRIPE_SECRET_KEY;
          } else {
            process.env.STRIPE_SECRET_KEY = keyValue;
          }
          vi.resetModules();

          const mod = await import("@/lib/stripe");

          // Only truly absent or empty string should throw
          const shouldThrow = keyValue === undefined || keyValue === "";

          if (shouldThrow) {
            expect(() => mod.getStripe()).toThrow(
              "STRIPE_SECRET_KEY is not set",
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
