import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkQuota } from "@/lib/plan-guard";
import { quotaExceededResponse } from "@/lib/quota-response";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const quotaResult = await checkQuota(dbUser.id, "webhooks");
  if (!quotaResult.allowed) return quotaExceededResponse(quotaResult);

  const body = await req.json() as { name?: string; url?: string; events?: string[] };
  if (!body.name || !body.url) {
    return NextResponse.json({ error: "name and url are required" }, { status: 400 });
  }

  const secret = `whsec_${randomBytes(24).toString("hex")}`;

  const webhook = await prisma.webhook.create({
    data: {
      userId: dbUser.id,
      name: body.name,
      url: body.url,
      secret,
      events: body.events ?? ["budget.alert", "billing.plan_upgraded"],
    },
  });

  return NextResponse.json(webhook, { status: 201 });
}
