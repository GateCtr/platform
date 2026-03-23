import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { computeOverallStatus } from "@/lib/health-utils";

const SERVICES = ["app", "database", "redis", "queue", "stripe"] as const;

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

function requestId() {
  return randomBytes(8).toString("hex");
}

// ─── OPTIONS /api/v1/system/health — CORS preflight ──────────────────────────

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

// ─── GET /api/v1/system/health — no auth required ────────────────────────────

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const rid = requestId();
  const headers = {
    "X-GateCtr-Request-Id": rid,
    ...corsHeaders(origin),
  };

  try {
    const results = await Promise.all(
      SERVICES.map((service) =>
        prisma.systemHealth.findFirst({
          where: { service },
          orderBy: { checkedAt: "desc" },
        }),
      ),
    );

    const services = SERVICES.reduce(
      (acc, service, i) => {
        const record = results[i];
        acc[service] = record
          ? { status: record.status, checkedAt: record.checkedAt }
          : { status: "unknown", checkedAt: null };
        return acc;
      },
      {} as Record<string, { status: string; checkedAt: Date | null }>,
    );

    const overallStatus = computeOverallStatus(
      Object.values(services).map((s) => s.status),
    );

    return NextResponse.json({ status: overallStatus, services }, { headers });
  } catch {
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers },
    );
  }
}
