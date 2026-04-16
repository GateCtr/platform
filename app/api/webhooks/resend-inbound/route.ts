/**
 * POST /api/webhooks/resend-inbound
 *
 * Handles inbound emails via Resend's receiving feature.
 * Resend sends `email.received` events signed with Svix — we verify the
 * signature then fetch the full content via resend.emails.receiving.get().
 *
 * Setup in Resend dashboard:
 *  Receiving → Add webhook → https://yourdomain.com/api/webhooks/resend-inbound
 *  Copy the signing secret → RESEND_INBOUND_WEBHOOK_SECRET in .env.local
 *
 * Docs:
 *  https://resend.com/docs/dashboard/receiving/introduction
 *  https://resend.com/docs/webhooks/verify-webhooks-requests
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { notifyInboundEmail } from "@/lib/telegram";
import { uploadBuffer } from "@/lib/storage";
import { randomBytes } from "crypto";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error(
      "[resend-inbound] RESEND_INBOUND_WEBHOOK_SECRET not configured",
    );
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Read raw body for signature verification
  const rawBody = await req.text();

  // Verify Svix signature — same mechanism as the outbound webhook
  let event: { type: string; data: { email_id: string } };
  try {
    event = getResend().webhooks.verify({
      payload: rawBody,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    }) as { type: string; data: { email_id: string } };
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Only handle email.received events
  if (event.type !== "email.received") {
    return NextResponse.json({ received: true });
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    return NextResponse.json({ error: "Missing email_id" }, { status: 400 });
  }

  // Deduplicate — if we already stored this email, skip
  const existing = await prisma.inboxEmail.findUnique({
    where: { resendId: emailId },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Fetch full email content from Resend
  const resend = getResend();
  let email: {
    from: string;
    to: string[];
    subject: string;
    html?: string | null;
    text?: string | null;
    headers?: Record<string, string> | null;
    message_id?: string | null;
    in_reply_to?: string | null;
  };

  try {
    const result = await resend.emails.receiving.get(emailId);
    if (!result.data) {
      console.error(
        "[resend-inbound] Failed to fetch email content:",
        result.error,
      );
      return NextResponse.json(
        { error: "Failed to fetch email" },
        { status: 500 },
      );
    }
    email = result.data as typeof email;
  } catch (err) {
    console.error("[resend-inbound] resend.emails.receiving.get error:", err);
    return NextResponse.json(
      { error: "Failed to fetch email" },
      { status: 500 },
    );
  }

  // Parse "Name <email>" format
  const fromRaw = email.from ?? "";
  const fromMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
  const fromName = fromMatch ? fromMatch[1].trim() : null;
  const fromEmail = fromMatch ? fromMatch[2].trim() : fromRaw.trim();
  const toEmail = Array.isArray(email.to)
    ? (email.to[0] ?? "")
    : (email.to ?? "");

  // Thread linking via In-Reply-To header
  let threadId: string | null = null;
  let replyToId: string | null = null;

  const inReplyTo = email.in_reply_to ?? email.headers?.["in-reply-to"] ?? null;
  if (inReplyTo) {
    const original = await prisma.inboxEmail.findFirst({
      where: { resendId: inReplyTo },
      select: { id: true, threadId: true },
    });
    if (original) {
      threadId = original.threadId ?? original.id;
      replyToId = original.id;
    }
  }

  // Upload attachments to R2 and store metadata
  type StoredAttachment = {
    filename: string;
    contentType: string;
    size: number;
    r2Key: string;
  };

  const storedAttachments: StoredAttachment[] = [];

  try {
    // Fetch attachment list via the dedicated Resend API
    const attachmentsResponse = await resend.emails.receiving.attachments.list({
      emailId,
    });

    const attachmentList = attachmentsResponse.data?.data ?? [];

    if (attachmentList.length > 0) {
      for (const att of attachmentList) {
        try {
          const response = await fetch(att.download_url);
          if (!response.ok) {
            console.error(
              `[resend-inbound] Failed to download attachment: ${att.filename}`,
            );
            continue;
          }

          const buffer = Buffer.from(await response.arrayBuffer());
          const ext = att.filename?.split(".").pop()?.toLowerCase() ?? "bin";
          const r2Key = `inbox/attachments/${randomBytes(8).toString("hex")}.${ext}`;

          await uploadBuffer(
            r2Key,
            buffer,
            att.content_type ?? "application/octet-stream",
          );

          storedAttachments.push({
            filename: att.filename ?? "attachment",
            contentType: att.content_type ?? "application/octet-stream",
            size: buffer.length,
            r2Key,
          });
        } catch (err) {
          console.error(
            "[resend-inbound] Failed to process attachment:",
            att.filename,
            err,
          );
        }
      }
    }
  } catch (err) {
    console.error("[resend-inbound] Failed to fetch attachments:", err);
  }

  // Store in DB
  const stored = await prisma.inboxEmail.create({
    data: {
      resendId: emailId,
      fromEmail,
      fromName,
      toEmail,
      subject: email.subject ?? "(no subject)",
      bodyHtml: email.html ?? null,
      bodyText: email.text ?? null,
      headers: email.headers ?? undefined,
      attachments: storedAttachments.length > 0 ? storedAttachments : [],
      threadId,
      inReplyTo: inReplyTo ?? null,
      replyToId,
    },
  });

  // Telegram notification
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gatectr.com";
  await notifyInboundEmail({
    from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
    subject: email.subject ?? "(no subject)",
    preview: email.text?.slice(0, 120),
    inboxUrl: `${appUrl}/admin/inbox`,
  });

  return NextResponse.json({ received: true, id: stored.id });
}
