import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> },
) {
  const { trackingId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gatectr.com";

  // URL passed as query param takes priority over DB targetUrl
  const urlParam = req.nextUrl.searchParams.get("url");

  const log = await prisma.outreachEmailLog.findUnique({
    where: { trackingId },
    select: { targetUrl: true, clickedAt: true },
  });

  if (!log) {
    return NextResponse.redirect(urlParam ?? baseUrl, { status: 302 });
  }

  // Idempotent update — only set clickedAt on the first click
  if (!log.clickedAt) {
    await prisma.outreachEmailLog.updateMany({
      where: { trackingId, clickedAt: null },
      data: { clickedAt: new Date(), status: "CLICKED" },
    });
  }

  const destination = urlParam ?? log.targetUrl ?? baseUrl;
  return NextResponse.redirect(destination, { status: 302 });
}
