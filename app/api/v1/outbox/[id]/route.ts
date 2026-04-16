import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** GET /api/v1/outbox/:id — full sent email */
export async function GET(_req: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  const email = await prisma.outboxEmail.findFirst({
    where: { id, userId: dbUser.id },
  });

  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...email,
    sentAt: email.sentAt?.toISOString() ?? null,
    deliveredAt: email.deliveredAt?.toISOString() ?? null,
    openedAt: email.openedAt?.toISOString() ?? null,
    clickedAt: email.clickedAt?.toISOString() ?? null,
    bouncedAt: email.bouncedAt?.toISOString() ?? null,
    createdAt: email.createdAt.toISOString(),
    updatedAt: email.updatedAt.toISOString(),
  });
}

/** DELETE /api/v1/outbox/:id */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  await prisma.outboxEmail.deleteMany({ where: { id, userId: dbUser.id } });
  return NextResponse.json({ deleted: true });
}
