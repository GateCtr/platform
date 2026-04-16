import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** GET /api/v1/inbox/:id — full email with HTML body */
export async function GET(_req: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const email = await prisma.inboxEmail.findUnique({
    where: { id },
    include: {
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          fromEmail: true,
          fromName: true,
          subject: true,
          bodyText: true,
          bodyHtml: true,
          createdAt: true,
        },
      },
    },
  });

  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Mark as read
  if (!email.isRead) {
    await prisma.inboxEmail.update({ where: { id }, data: { isRead: true } });
  }

  return NextResponse.json({
    ...email,
    attachments: Array.isArray(email.attachments) ? email.attachments : [],
    createdAt: email.createdAt.toISOString(),
    updatedAt: email.updatedAt.toISOString(),
  });
}

/** PATCH /api/v1/inbox/:id — update isRead, isStarred, isArchived, labels */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed = ["isRead", "isStarred", "isArchived", "labels"] as const;
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const updated = await prisma.inboxEmail.update({ where: { id }, data });
  return NextResponse.json(updated);
}

/** DELETE /api/v1/inbox/:id — hard delete */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.inboxEmail.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
