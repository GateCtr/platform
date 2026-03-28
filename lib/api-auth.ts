import crypto from "crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { logAudit } from "@/lib/audit";
import { dispatchWebhook } from "@/lib/webhooks";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthContext {
  userId: string;
  apiKeyId: string;
  scopes: string[];
  projectId?: string;
  environment: "live" | "test";
}

export type ApiAuthErrorCode =
  | "missing_api_key"
  | "invalid_api_key"
  | "api_key_revoked"
  | "api_key_expired"
  | "insufficient_scope";

export class ApiAuthError extends Error {
  code: ApiAuthErrorCode;
  httpStatus: 401 | 403;

  constructor(code: ApiAuthErrorCode, httpStatus: 401 | 403, message?: string) {
    super(message ?? code);
    this.name = "ApiAuthError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function sha256Hex(input: string): Buffer {
  return crypto.createHash("sha256").update(input).digest();
}

// ─── Brute-force helpers ──────────────────────────────────────────────────────

const BRUTE_COUNT_TTL = 300; // 5 minutes
const BRUTE_BLOCK_TTL = 900; // 15 minutes
const BRUTE_THRESHOLD = 10;

async function isIpBlocked(ip: string): Promise<boolean> {
  try {
    const blocked = await redis.get(`brute:ip:${ip}`);
    return blocked !== null;
  } catch {
    // fail-open
    return false;
  }
}

async function recordFailedAttempt(ip: string, userId?: string): Promise<void> {
  try {
    const countKey = `brute:count:${ip}`;
    const count = await redis.incr(countKey);
    if (count === 1) {
      // First failure in this window — set TTL
      await redis.expire(countKey, BRUTE_COUNT_TTL);
    }
    if (count >= BRUTE_THRESHOLD) {
      // Block the IP
      await redis.set(`brute:ip:${ip}`, "1", { ex: BRUTE_BLOCK_TTL });
      // Fire-and-forget: log brute force detection
      logAudit({
        userId,
        resource: "api_key",
        action: "brute_force_detected",
        ipAddress: ip,
        success: false,
      }).catch(() => {});
    }
  } catch {
    // fail-open — Redis errors must not block requests
  }
}

// ─── Core auth function ───────────────────────────────────────────────────────

export async function authenticateApiKey(
  req: NextRequest,
): Promise<AuthContext> {
  const ip = getClientIp(req);

  // 1. Extract Bearer token
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiAuthError("missing_api_key", 401);
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new ApiAuthError("missing_api_key", 401);
  }

  // 2. Check if IP is blocked (brute-force protection)
  const blocked = await isIpBlocked(ip);
  if (blocked) {
    throw new ApiAuthError("invalid_api_key", 401);
  }

  // Helper to handle auth failure side-effects
  const handleFailure = (userId?: string) => {
    // Fire-and-forget: increment brute-force counter
    recordFailedAttempt(ip, userId).catch(() => {});
    // Fire-and-forget: audit log
    logAudit({
      userId,
      resource: "api_key",
      action: "auth_failed",
      ipAddress: ip,
      success: false,
    }).catch(() => {});
  };

  // 3. Prefix lookup — derive prefix from token format gct_live_xxx or gct_test_xxx
  // New format: gct_live_xxxxxx (15 chars) or gct_test_xxxxxx (15 chars)
  // Legacy format: gct_xxxxxx (12 chars)
  const prefix = token.startsWith("gct_live_") || token.startsWith("gct_test_")
    ? token.slice(0, 15)
    : token.slice(0, 12);
  const record = await prisma.apiKey.findFirst({
    where: { prefix, isActive: true },
  });

  if (!record) {
    handleFailure();
    throw new ApiAuthError("invalid_api_key", 401);
  }

  // 4. Constant-time hash comparison (SHA-256)
  const providedHash = sha256Hex(token);
  const storedHash = Buffer.from(record.keyHash, "hex");

  // Buffers must be same length for timingSafeEqual
  let hashMatch = false;
  if (providedHash.length === storedHash.length) {
    hashMatch = crypto.timingSafeEqual(providedHash, storedHash);
  }

  if (!hashMatch) {
    handleFailure(record.userId);
    throw new ApiAuthError("invalid_api_key", 401);
  }

  // 5. Check isActive (redundant with query but explicit per spec)
  if (!record.isActive) {
    handleFailure(record.userId);
    throw new ApiAuthError("api_key_revoked", 401);
  }

  // 6. Check expiry
  if (record.expiresAt && record.expiresAt < new Date()) {
    handleFailure(record.userId);
    dispatchWebhook(record.userId, "api_key.expired", {
      api_key_id: record.id,
      name: record.name,
      expired_at: record.expiresAt.toISOString(),
    }).catch(() => {});
    throw new ApiAuthError("api_key_expired", 401);
  }

  // 9. Fire-and-forget: update lastUsedAt and lastUsedIp
  prisma.apiKey
    .update({
      where: { id: record.id },
      data: { lastUsedAt: new Date(), lastUsedIp: ip },
    })
    .catch(() => {});

  // 10. Return AuthContext
  return {
    userId: record.userId,
    apiKeyId: record.id,
    scopes: record.scopes,
    projectId: record.projectId ?? undefined,
    environment: (record.environment === "test" ? "test" : "live") as "live" | "test",
  };
}

// ─── Dual auth helper (API key + Clerk session) ───────────────────────────────

export interface ResolvedAuth {
  userId: string;
  scopes: string[];
  apiKeyId: string | null;
}

/**
 * Resolves auth from either a GateCtr API key (Bearer gct_*) or a Clerk session.
 * Returns null if neither is present/valid — caller must return 401.
 */
export async function resolveAuth(
  req: import("next/server").NextRequest,
): Promise<ResolvedAuth | { error: ApiAuthErrorCode; httpStatus: 401 | 403 }> {
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer gct_")) {
    try {
      const ctx = await authenticateApiKey(req);
      return {
        userId: ctx.userId,
        scopes: ctx.scopes,
        apiKeyId: ctx.apiKeyId,
      };
    } catch (err) {
      if (err instanceof ApiAuthError) {
        return { error: err.code, httpStatus: err.httpStatus };
      }
      return { error: "invalid_api_key", httpStatus: 401 };
    }
  }

  // Fall back to Clerk session
  const { auth } = await import("@clerk/nextjs/server");
  const { userId: clerkId } = await auth();
  if (!clerkId) return { error: "missing_api_key", httpStatus: 401 };

  const { prisma } = await import("@/lib/prisma");
  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser) return { error: "invalid_api_key", httpStatus: 401 };

  return {
    userId: dbUser.id,
    scopes: ["complete", "chat", "read", "admin"],
    apiKeyId: null,
  };
}

export function checkScope(
  scopes: string[],
  required: string,
): { error: "insufficient_scope"; httpStatus: 403 } | null {
  if (!scopes.includes(required)) {
    return { error: "insufficient_scope", httpStatus: 403 };
  }
  return null;
}

export function requireScope(scopes: string[], required: string): void {
  if (!scopes.includes(required)) {
    throw new ApiAuthError(
      "insufficient_scope",
      403,
      `Required scope: ${required}`,
    );
  }
}
