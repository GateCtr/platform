import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getOutreachQueue } from "@/lib/queues";
import {
  notifyEmailDelivered,
  notifyEmailOpened,
  notifyEmailBounced,
} from "@/lib/telegram";

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
  let event: { type: string; data: { email_id?: string; to?: string[] } };
  try {
    event = getResend().webhooks.verify({
      payload: rawBody,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    }) as { type: string; data: { email_id?: string; to?: string[] } };
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
      // ── Outbox tracking ────────────────────────────────────────────────────
      case "email.delivered": {
        // Update outbox record
        const outbox = await prisma.outboxEmail.findUnique({
          where: { resendId },
          select: { id: true, toEmail: true, subject: true, status: true },
        });
        if (outbox) {
          await prisma.outboxEmail.update({
            where: { id: outbox.id },
            data: { status: "DELIVERED", deliveredAt: new Date() },
          });
          await notifyEmailDelivered({
            to: outbox.toEmail,
            subject: outbox.subject,
          });
        }

        // Also update outreach logs (idempotent)
        await prisma.outreachEmailLog.updateMany({
          where: { resendId },
          data: { status: "DELIVERED" },
        });
        // Also update EmailLog
        await prisma.emailLog.updateMany({
          where: { resendId },
          data: { status: "DELIVERED" },
        });
        break;
      }

      case "email.opened": {
        const outbox = await prisma.outboxEmail.findUnique({
          where: { resendId },
          select: {
            id: true,
            toEmail: true,
            subject: true,
            openCount: true,
            openedAt: true,
          },
        });
        if (outbox) {
          await prisma.outboxEmail.update({
            where: { id: outbox.id },
            data: {
              status: "OPENED",
              openedAt: outbox.openedAt ?? new Date(),
              openCount: { increment: 1 },
            },
          });
          if (!outbox.openedAt) {
            // First open only
            await notifyEmailOpened({
              to: outbox.toEmail,
              subject: outbox.subject,
            });
          }
        }

        await prisma.outreachEmailLog.updateMany({
          where: { resendId, openedAt: null },
          data: { openedAt: new Date(), status: "OPENED" },
        });
        await prisma.emailLog.updateMany({
          where: { resendId },
          data: { status: "OPENED", openedAt: new Date() },
        });
        break;
      }

      case "email.clicked": {
        const outbox = await prisma.outboxEmail.findUnique({
          where: { resendId },
          select: { id: true, clickedAt: true },
        });
        if (outbox) {
          await prisma.outboxEmail.update({
            where: { id: outbox.id },
            data: {
              status: "CLICKED",
              clickedAt: outbox.clickedAt ?? new Date(),
              clickCount: { increment: 1 },
            },
          });
        }

        await prisma.outreachEmailLog.updateMany({
          where: { resendId, clickedAt: null },
          data: { clickedAt: new Date(), status: "CLICKED" },
        });
        await prisma.emailLog.updateMany({
          where: { resendId },
          data: { status: "CLICKED", clickedAt: new Date() },
        });
        break;
      }

      case "email.bounced": {
        // Outbox
        const outbox = await prisma.outboxEmail.findUnique({
          where: { resendId },
          select: { id: true, toEmail: true, subject: true },
        });
        if (outbox) {
          await prisma.outboxEmail.update({
            where: { id: outbox.id },
            data: { status: "BOUNCED", bouncedAt: new Date() },
          });
          await notifyEmailBounced({
            to: outbox.toEmail,
            subject: outbox.subject,
          });
        }

        // Outreach
        const outreachLog = await prisma.outreachEmailLog.findUnique({
          where: { resendId },
          select: { id: true, prospectId: true },
        });
        if (outreachLog) {
          await prisma.$transaction([
            prisma.outreachEmailLog.update({
              where: { id: outreachLog.id },
              data: { status: "BOUNCED" },
            }),
            prisma.outreachProspect.update({
              where: { id: outreachLog.prospectId },
              data: { status: "REFUSED" },
            }),
          ]);

          try {
            const jobs = await (
              await getOutreachQueue()
            ).getJobs(["delayed", "waiting"]);
            for (const job of jobs) {
              const data = job.data as { prospectId?: string };
              if (data.prospectId === outreachLog.prospectId) {
                await job.remove();
              }
            }
          } catch (queueErr) {
            console.error(
              "[resend webhook] Failed to cancel follow-up jobs:",
              queueErr,
            );
          }
        }

        await prisma.emailLog.updateMany({
          where: { resendId },
          data: { status: "BOUNCED", bouncedAt: new Date() },
        });
        break;
      }

      case "email.complained": {
        // Spam complaint — mark bounced
        const outbox = await prisma.outboxEmail.findUnique({
          where: { resendId },
          select: { id: true },
        });
        if (outbox) {
          await prisma.outboxEmail.update({
            where: { id: outbox.id },
            data: {
              status: "BOUNCED",
              bouncedAt: new Date(),
              failReason: "spam_complaint",
            },
          });
        }
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
