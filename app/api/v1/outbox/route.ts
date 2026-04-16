import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { render } from "@react-email/render";
import OutboxEmail from "@/components/emails/outbox-compose";
import { parseBodyForEmail } from "@/lib/email-body-parser";
import { s3 } from "@/lib/storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const R2_BUCKET = process.env.R2_BUCKET ?? "gatectr";

/**
 * GET /api/v1/outbox
 * Returns paginated sent emails.
 */
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
  );
  const q = searchParams.get("q")?.trim() ?? "";

  const where: Record<string, unknown> = { userId: dbUser.id };
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { toEmail: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, emails] = await Promise.all([
    prisma.outboxEmail.count({ where }),
    prisma.outboxEmail.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        toEmail: true,
        toName: true,
        fromEmail: true,
        subject: true,
        bodyText: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        openedAt: true,
        clickedAt: true,
        bouncedAt: true,
        openCount: true,
        clickCount: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    emails: emails.map((e) => ({
      ...e,
      preview: e.bodyText?.slice(0, 160) ?? "",
      sentAt: e.sentAt?.toISOString() ?? null,
      deliveredAt: e.deliveredAt?.toISOString() ?? null,
      openedAt: e.openedAt?.toISOString() ?? null,
      clickedAt: e.clickedAt?.toISOString() ?? null,
      bouncedAt: e.bouncedAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * POST /api/v1/outbox
 * Compose and send an email via Resend.
 *
 * Body: { to, toName?, subject, bodyHtml, bodyText?, replyTo?, inReplyToId? }
 */
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, email: true, name: true },
  });
  if (!dbUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const {
    to,
    toName,
    subject,
    bodyHtml,
    bodyText,
    replyTo,
    inReplyToId,
    attachments,
  } = body;

  if (!to || !subject || !bodyHtml) {
    return NextResponse.json(
      { error: "Missing required fields: to, subject, bodyHtml" },
      { status: 400 },
    );
  }

  // attachments: Array<{ key: string; filename: string; contentType: string }>
  type AttachmentInput = { key: string; filename: string; contentType: string };
  const attachmentList: AttachmentInput[] = Array.isArray(attachments)
    ? attachments
    : [];

  const fromEmail =
    process.env.INBOX_FROM_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    "hello@gatectr.com";
  const fromName = process.env.INBOX_FROM_NAME ?? "GateCtr";

  // If replying, fetch the original email to get its Message-ID for threading headers
  let inReplyToMessageId: string | null = null;
  let referencesHeader: string | null = null;

  if (inReplyToId) {
    const original = await prisma.inboxEmail.findUnique({
      where: { id: inReplyToId },
      select: { resendId: true, inReplyTo: true, headers: true },
    });
    if (original) {
      // Use the original email's Message-ID (resendId or from headers)
      const headers = original.headers as Record<string, string> | null;
      const originalMessageId =
        headers?.["message-id"] ??
        headers?.["Message-ID"] ??
        (original.resendId ? `<${original.resendId}@resend.dev>` : null);

      if (originalMessageId) {
        inReplyToMessageId = originalMessageId;
        // References = original References + original Message-ID
        const originalRefs =
          headers?.["references"] ?? headers?.["References"] ?? "";
        referencesHeader = originalRefs
          ? `${originalRefs} ${originalMessageId}`
          : originalMessageId;
      }
    }
  }

  // Create outbox record first (QUEUED)
  const outbox = await prisma.outboxEmail.create({
    data: {
      userId: dbUser.id,
      fromEmail,
      fromName,
      toEmail: to,
      toName: toName ?? null,
      subject,
      bodyHtml,
      bodyText: bodyText ?? null,
      replyTo: replyTo ?? null,
      inReplyToId: inReplyToId ?? null,
      status: "SENDING",
    },
  });

  try {
    // Parse plain text body into structured paragraphs — no HTML in the template
    const paragraphs = parseBodyForEmail(bodyText ?? bodyHtml);

    // Render the email with the GateCtr design system
    const html = await render(
      OutboxEmail({
        subject,
        paragraphs,
        fromName,
      }),
    );

    // Fetch attachments from R2 and convert to base64 for Resend
    const resendAttachments: Array<{ filename: string; content: string }> = [];
    for (const att of attachmentList) {
      try {
        const obj = await s3.send(
          new GetObjectCommand({ Bucket: R2_BUCKET, Key: att.key }),
        );
        const chunks: Uint8Array[] = [];
        for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        resendAttachments.push({
          filename: att.filename,
          content: buffer.toString("base64"),
        });
      } catch (err) {
        // Log only the error, not the user-provided key
        console.error("[outbox] Failed to fetch attachment from R2:", err);
      }
    }

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
      replyTo: replyTo ?? fromEmail,
      headers: {
        ...(inReplyToMessageId ? { "In-Reply-To": inReplyToMessageId } : {}),
        ...(referencesHeader ? { References: referencesHeader } : {}),
      },
      attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
      tags: [
        { name: "type", value: "outbox" },
        { name: "outbox_id", value: outbox.id },
      ],
    });

    const resendId = result.data?.id ?? null;

    await prisma.outboxEmail.update({
      where: { id: outbox.id },
      data: {
        resendId,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ id: outbox.id, resendId, status: "SENT" });
  } catch (err) {
    await prisma.outboxEmail.update({
      where: { id: outbox.id },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        failReason: err instanceof Error ? err.message : "Unknown error",
      },
    });

    console.error("[outbox] send failed:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
