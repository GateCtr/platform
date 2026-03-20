import Stripe from "stripe";

// During Next.js production build, env vars are not available — skip the guard.
// At runtime (dev, test, production server), enforce the key is present.
if (
  process.env.NEXT_PHASE !== "phase-production-build" &&
  !process.env.STRIPE_SECRET_KEY
) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion,
});
