import Stripe from "stripe";

/**
 * Returns a Stripe client instance.
 * Throws if STRIPE_SECRET_KEY is missing — called at runtime, not at module load.
 * This avoids build-time failures when env vars are not available in Docker.
 */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion,
  });
}

// Lazy singleton — initialized on first property access, never at module load
let _instance: Stripe | null = null;

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    if (!_instance) _instance = getStripe();
    return (_instance as unknown as Record<string | symbol, unknown>)[prop];
  },
});
