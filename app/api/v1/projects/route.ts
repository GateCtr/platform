import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkQuota } from "@/lib/plan-guard";
import { quotaExceededResponse } from "@/lib/quota-response";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const quotaResult = await checkQuota(dbUser.id, "projects");
  if (!quotaResult.allowed) return quotaExceededResponse(quotaResult);

  const body = await req.json() as { name?: string; description?: string; slug?: string };
  if (!body.name || !body.slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      userId: dbUser.id,
      name: body.name,
      slug: body.slug,
      description: body.description ?? null,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
