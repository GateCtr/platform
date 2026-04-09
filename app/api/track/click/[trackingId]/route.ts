import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> },
) {
  const { trackingId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gatectr.com";

  const log = await prisma.outreachEmailLog.findUnique({
    where: { trackingId },
    select: { targetUrl: true, clickedAt: true },
  });

  if (!log) {
    return NextResponse.redirect(baseUrl, { status: 302 });
  }

  // Idempotent update — only set clickedAt on the first click
  if (!log.clickedAt) {
    await prisma.outreachEmailLog.updateMany({
      where: { trackingId, clickedAt: null },
      data: { clickedAt: new Date(), status: "CLICKED" },
    });
  }

  const destination = log.targetUrl ?? baseUrl;
  return NextResponse.redirect(destination, { status: 302 });
}
