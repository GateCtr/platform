import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// Lazy init — RESEND_API_KEY is not available at build time in Docker
function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[resend webhook] RESEND_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Verify signature using resend's built-in Webhooks verifier
  let event: { type: string; data: { email_id?: string } };
  try {
    event = getResend().webhooks.verify({
      payload: rawBody,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    }) as { type: string; data: { email_id?: string } };
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const resendId = event.data?.email_id;

  // Unknown events or missing resendId — idempotent 200
  if (!resendId) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "email.opened": {
        await prisma.outreachEmailLog.updateMany({
          where: { resendId, openedAt: null },
          data: { openedAt: new Date(), status: "OPENED" },
        });
        break;
      }

      case "email.clicked": {
        await prisma.outreachEmailLog.updateMany({
          where: { resendId, clickedAt: null },
          data: { clickedAt: new Date(), status: "CLICKED" },
        });
        break;
      }

      case "email.bounced": {
        const log = await prisma.outreachEmailLog.findUnique({
          where: { resendId },
          select: { id: true, prospectId: true },
        });
        if (!log) break; // resendId not found — idempotent

        await prisma.$transaction([
          prisma.outreachEmailLog.update({
            where: { id: log.id },
            data: { status: "BOUNCED" },
          }),
          prisma.outreachProspect.update({
            where: { id: log.prospectId },
            data: { status: "REFUSED" },
          }),
        ]);
        break;
      }

      case "email.delivered": {
        // updateMany is idempotent — no-op if resendId not found
        await prisma.outreachEmailLog.updateMany({
          where: { resendId },
          data: { status: "DELIVERED" },
        });
        break;
      }

      default:
        // Unknown event type — return 200 (no-op)
        break;
    }
  } catch (err) {
    console.error("[resend webhook] Processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
