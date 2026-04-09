import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SERVICES = ["app", "database", "redis", "queue", "stripe"] as const;
const DAYS = 90;

const ALLOWED_ORIGINS = new Set([
  "https://gatectr.com",
  "https://status.gatectr.com",
  "https://app.gatectr.com",
  ...(process.env.NEXT_PUBLIC_MARKETING_URL
    ? [process.env.NEXT_PUBLIC_MARKETING_URL]
    : []),
  ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
]);

function corsHeaders(origin: string | null) {
  const allowed =
    origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://gatectr.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

/**
 * GET /api/v1/system/uptime
 * Returns 90 days of daily uptime per service.
 * Each day: "healthy" | "degraded" | "down" | "empty" (no data)
 * Public — no auth required.
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

    const records = await prisma.systemHealth.findMany({
      where: { checkedAt: { gte: since } },
      select: { service: true, status: true, checkedAt: true },
      orderBy: { checkedAt: "asc" },
    });

    // Build a map: service → date string → worst status of the day
    const STATUS_RANK: Record<string, number> = {
      HEALTHY: 0,
      DEGRADED: 1,
      DOWN: 2,
    };

    const serviceMap: Record<string, Record<string, string>> = {};
    for (const svc of SERVICES) serviceMap[svc] = {};

    for (const r of records) {
      const day = r.checkedAt.toISOString().slice(0, 10); // "YYYY-MM-DD"
      const current = serviceMap[r.service]?.[day];
      const currentRank = current ? (STATUS_RANK[current] ?? 0) : -1;
      const newRank = STATUS_RANK[r.status] ?? 0;
      if (newRank > currentRank) {
        if (serviceMap[r.service]) serviceMap[r.service][day] = r.status;
      }
    }

    // Build ordered array of last DAYS days (oldest first)
    const days: string[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      days.push(d.toISOString().slice(0, 10));
    }

    // For each service, map days to status
    const result: Record<string, string[]> = {};
    for (const svc of SERVICES) {
      result[svc] = days.map((day) => {
        const s = serviceMap[svc]?.[day];
        if (!s) return "empty";
        if (s === "DOWN") return "down";
        if (s === "DEGRADED") return "degraded";
        return "healthy";
      });
    }

    // Compute uptime % per service (exclude empty days)
    const uptime: Record<string, number> = {};
    for (const svc of SERVICES) {
      const svcDays = result[svc];
      const nonEmpty = svcDays.filter((d) => d !== "empty");
      if (nonEmpty.length === 0) {
        uptime[svc] = 100;
      } else {
        const healthy = nonEmpty.filter((d) => d === "healthy").length;
        uptime[svc] = Math.round((healthy / nonEmpty.length) * 10000) / 100;
      }
    }

    return NextResponse.json(
      { days: result, uptime, dates: days },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers },
    );
  }
}
