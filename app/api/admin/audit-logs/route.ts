import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

/**
 * GET /api/admin/audit-logs
 * Returns paginated audit logs with optional filters.
 *
 * Query params:
 *   page        - page number (default: 1)
 *   pageSize    - entries per page (default: 25, max: 100)
 *   resource    - filter by resource type
 *   status      - "success" | "failed"
 *   search      - filter by user email (contains)
 *   actor       - filter by actor email (contains)
 *   action      - filter by action keyword (contains, case-insensitive)
 *   from        - ISO date string — createdAt >= from
 *   to          - ISO date string — createdAt <= to
 *   export      - "csv" to stream CSV instead of JSON
 *
 * Requires: audit:read permission
 */
export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await getCurrentUser();
  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canRead = await hasPermission(currentUser.id, "audit:read");
  if (!canRead)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "25", 10)),
  );
  const resource = searchParams.get("resource") || undefined;
  const status = searchParams.get("status");
  const search = searchParams.get("search") || undefined;
  const actorEmail = searchParams.get("actor") || undefined;
  const actionKeyword = searchParams.get("action") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const exportCsv = searchParams.get("export") === "csv";

  // Resolve actor email → actorId via subquery
  let actorId: string | undefined;
  if (actorEmail) {
    const actorUser = await prisma.user.findFirst({
      where: { email: { contains: actorEmail, mode: "insensitive" } },
      select: { id: true },
    });
    // If no user found for the actor filter, return empty result
    if (!actorUser) {
      if (exportCsv) {
        const header =
          "id,timestamp,user,actor,resource,action,resourceId,ip,success,error";
        return new Response(header + "\n", {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        });
      }
      return NextResponse.json({ logs: [], total: 0, page, pageSize, totalPages: 0 });
    }
    actorId = actorUser.id;
  }

  const where = {
    ...(resource ? { resource } : {}),
    ...(status === "success"
      ? { success: true }
      : status === "failed"
        ? { success: false }
        : {}),
    ...(search
      ? { user: { email: { contains: search, mode: "insensitive" as const } } }
      : {}),
    ...(actorId ? { actorId } : {}),
    ...(actionKeyword
      ? { action: { contains: actionKeyword, mode: "insensitive" as const } }
      : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  // CSV export — stream all matching rows (no pagination)
  if (exportCsv) {
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10_000,
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    // Resolve actor emails in bulk
    const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean) as string[])];
    const actorMap = new Map<string, string>();
    if (actorIds.length > 0) {
      const actors = await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, email: true },
      });
      for (const a of actors) actorMap.set(a.id, a.email);
    }

    const header =
      "id,timestamp,user,actor,resource,action,resourceId,ip,success,error";
    const rows = logs.map((l) =>
      [
        l.id,
        l.createdAt.toISOString(),
        `"${l.user?.email ?? ""}"`,
        `"${l.actorId ? (actorMap.get(l.actorId) ?? l.actorId) : ""}"`,
        l.resource,
        l.action,
        l.resourceId ?? "",
        l.ipAddress ?? "",
        l.success,
        `"${(l.error ?? "").replace(/"/g, '""')}"`,
      ].join(","),
    );

    return new Response([header, ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // JSON response with pagination
  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
