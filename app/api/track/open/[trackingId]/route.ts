import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Hardcoded 35-byte transparent GIF89a
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> },
) {
  const { trackingId } = await params;

  // Fire-and-forget — do not await, do not block the GIF response
  prisma.outreachEmailLog
    .updateMany({
      where: { trackingId, openedAt: null },
      data: { openedAt: new Date(), status: "OPENED" },
    })
    .catch(() => {
      // Silently ignore — unknown trackingId or DB error must not affect response
    });

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store",
    },
  });
}
