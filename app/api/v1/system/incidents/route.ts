import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
 * GET /api/v1/system/incidents?year=2026&month=4
 * Returns incidents for a given month (defaults to current month).
 * Public — no auth required.
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(
      searchParams.get("year") ?? String(now.getFullYear()),
      10,
    );
    const month = parseInt(
      searchParams.get("month") ?? String(now.getMonth() + 1),
      10,
    );

    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 1);

    const incidents = await prisma.incident.findMany({
      where: {
        startedAt: { gte: from, lt: to },
      },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        impact: true,
        services: true,
        startedAt: true,
        resolvedAt: true,
      },
    });

    return NextResponse.json({ incidents }, { headers });
  } catch {
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers },
    );
  }
}
