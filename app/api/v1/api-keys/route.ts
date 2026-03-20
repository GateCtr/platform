import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkQuota } from "@/lib/plan-guard";
import { quotaExceededResponse } from "@/lib/quota-response";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { randomBytes, createHash } from "crypto";

function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `gct_${randomBytes(24).toString("hex")}`;
  const prefix = raw.slice(0, 12);
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, prefix, hash };
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // ── Rate limit: 10 creations/hour per user ──────────────────────────────────
  const rl = await rateLimit(dbUser.id, RATE_LIMITS.apiKeys);
  if (!rl.allowed) return rateLimitResponse(rl);

  const quotaResult = await checkQuota(dbUser.id, "api_keys");
  if (!quotaResult.allowed) return quotaExceededResponse(quotaResult);

  const body = await req.json() as { name?: string; projectId?: string; scopes?: string[] };
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { raw, prefix, hash } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: dbUser.id,
      name: body.name,
      keyHash: hash,
      prefix,
      projectId: body.projectId ?? null,
      scopes: body.scopes ?? ["complete", "read"],
    },
  });

  // Return the raw key only once — it cannot be retrieved again
  return NextResponse.json({ ...apiKey, key: raw }, { status: 201 });
}
