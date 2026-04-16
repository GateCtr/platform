import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const ok = await hasPermission(user.id, "analytics:read");
  if (!ok) return new Response("Forbidden", { status: 403 });

  const launchDate = process.env.LAUNCH_DATE
    ? new Date(process.env.LAUNCH_DATE)
    : new Date("2026-04-15T00:00:00Z");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // Client disconnected
        }
      };

      // Send initial snapshot
      const snapshot = await getSnapshot(launchDate);
      send(snapshot);

      // Poll every 10 seconds
      const interval = setInterval(async () => {
        try {
          const data = await getSnapshot(launchDate);
          send(data);
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 10_000);

      // Clean up on close
      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function getSnapshot(launchDate: Date) {
  const users = await prisma.user.findMany({
    where: { isActive: true, createdAt: { gte: launchDate } },
    select: { metadata: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const total = users.length;
  const last1h = users.filter(
    (u) => u.createdAt >= new Date(Date.now() - 60 * 60 * 1000),
  ).length;

  const bySource: Record<string, number> = {};
  for (const u of users) {
    const meta = (u.metadata ?? {}) as Record<string, unknown>;
    const source =
      typeof meta.ref === "string" && meta.ref.trim()
        ? meta.ref.trim()
        : "direct";
    bySource[source] = (bySource[source] ?? 0) + 1;
  }

  return {
    total,
    last1h,
    bySource,
    timestamp: new Date().toISOString(),
  };
}
