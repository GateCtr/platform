import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/v1/inbox
 * Returns paginated inbox emails (inbound).
 *
 * Query params:
 *  - page (default 1)
 *  - limit (default 20, max 50)
 *  - filter: "all" | "unread" | "starred" | "archived" (default "all", excludes archived)
 *  - q: search query (subject / from)
 */
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
  );
  const filter = searchParams.get("filter") ?? "all";
  const q = searchParams.get("q")?.trim() ?? "";

  const where: Record<string, unknown> = {};

  if (filter === "unread") {
    where.isRead = false;
    where.isArchived = false;
  } else if (filter === "starred") {
    where.isStarred = true;
    where.isArchived = false;
  } else if (filter === "archived") {
    where.isArchived = true;
  } else {
    // "all" — exclude archived
    where.isArchived = false;
  }

  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { fromEmail: { contains: q, mode: "insensitive" } },
      { fromName: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, emails] = await Promise.all([
    prisma.inboxEmail.count({ where }),
    prisma.inboxEmail.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        fromEmail: true,
        fromName: true,
        toEmail: true,
        subject: true,
        bodyText: true,
        isRead: true,
        isStarred: true,
        isArchived: true,
        labels: true,
        threadId: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    emails: emails.map((e) => ({
      ...e,
      preview: e.bodyText?.slice(0, 160) ?? "",
      createdAt: e.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    unreadCount: await prisma.inboxEmail.count({
      where: { isRead: false, isArchived: false },
    }),
  });
}
