import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  window: number;
  /** Key prefix for namespacing (e.g. "auth", "checkout") */
  prefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number; // Unix timestamp (seconds)
  limit: number;
}

// ─── Presets ──────────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  /** Auth endpoints — sign-in attempts, password reset */
  auth: { limit: 10, window: 900, prefix: "rl:auth" }, // 10/15min per IP
  /** Billing checkout — prevent checkout spam */
  checkout: { limit: 5, window: 3600, prefix: "rl:checkout" }, // 5/hour per user
  /** API key creation */
  apiKeys: { limit: 10, window: 3600, prefix: "rl:apikeys" }, // 10/hour per user
  /** Admin actions (bulk invite, refund, etc.) */
  admin: { limit: 30, window: 60, prefix: "rl:admin" }, // 30/min per user
  /** Waitlist join — already has its own, but unified here */
  waitlist: { limit: 3, window: 3600, prefix: "rl:waitlist" }, // 3/hour per IP
  /** Onboarding form submissions */
  onboarding: { limit: 10, window: 3600, prefix: "rl:onboarding" }, // 10/hour per user
  /** Generic public API */
  publicApi: { limit: 60, window: 60, prefix: "rl:public" }, // 60/min per IP
  /** Webhook delivery endpoints */
  webhooks: { limit: 100, window: 60, prefix: "rl:webhooks" }, // 100/min per user
} as const satisfies Record<string, RateLimitConfig>;

// ─── Core sliding window ──────────────────────────────────────────────────────

/**
 * Sliding window rate limiter using Redis INCR + EXPIRE.
 * Fail-open: if Redis is unavailable, the request is allowed.
 *
 * @param identifier - Unique key (IP address or user ID)
 * @param config - Rate limit configuration
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const key = `${config.prefix}:${identifier}`;

  try {
    const count = await redis.incr(key);

    if (count === 1) {
      // First request in this window — set TTL
      await redis.expire(key, config.window);
    }

    // Get remaining TTL for reset timestamp
    const ttl = await redis.ttl(key);
    const reset =
      Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : config.window);
    const remaining = Math.max(0, config.limit - count);

    return {
      allowed: count <= config.limit,
      remaining,
      reset,
      limit: config.limit,
    };
  } catch {
    // Fail-open: Redis unavailable → allow request
    return {
      allowed: true,
      remaining: config.limit,
      reset: 0,
      limit: config.limit,
    };
  }
}

// ─── Response helper ──────────────────────────────────────────────────────────

/**
 * Returns a 429 response with standard rate limit headers.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(result.reset),
        "Retry-After": String(result.reset - Math.floor(Date.now() / 1000)),
      },
    },
  );
}

// ─── IP extractor ─────────────────────────────────────────────────────────────

/**
 * Extract the real client IP from request headers.
 * Handles Vercel, Cloudflare, and direct connections.
 */
export function getClientIp(req: Request | { headers: Headers }): string {
  const headers = req instanceof Request ? req.headers : req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}
