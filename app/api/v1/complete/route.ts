import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkQuota } from "@/lib/plan-guard";
import { quotaExceededResponse } from "@/lib/quota-response";

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userId = dbUser.id;

  // ── Quota checks ────────────────────────────────────────────────────────────
  const [rpmResult, monthResult] = await Promise.all([
    checkQuota(userId, "requests_per_minute"),
    checkQuota(userId, "tokens_per_month"),
  ]);

  if (!rpmResult.allowed) return quotaExceededResponse(rpmResult);
  if (!monthResult.allowed) return quotaExceededResponse(monthResult);

  // ── Placeholder — LLM routing logic goes here ───────────────────────────────
  const body = await req.json() as { prompt?: string; model?: string };

  return NextResponse.json({
    id: `cmpl_${Date.now()}`,
    object: "text_completion",
    model: body.model ?? "gpt-4o",
    choices: [{ text: "", finish_reason: "stop" }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    overage: "overage" in monthResult ? monthResult.overage : false,
  });
}
