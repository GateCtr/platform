import { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") || undefined;
  const status = searchParams.get("status"); // "success" | "failed"
  const search = searchParams.get("search") || undefined;

  const where = {
    ...(resource ? { resource } : {}),
    ...(status === "success"
      ? { success: true }
      : status === "failed"
        ? { success: false }
        : {}),
    ...(search
      ? {
          user: {
            email: { contains: search, mode: "insensitive" as const },
          },
        }
      : {}),
  };

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000,
    include: { user: { select: { email: true, name: true } } },
  });

  const header =
    "id,timestamp,user,resource,action,resourceId,ip,success,error";
  const rows = logs.map((l) =>
    [
      l.id,
      l.createdAt.toISOString(),
      `"${l.user?.email ?? ""}"`,
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
