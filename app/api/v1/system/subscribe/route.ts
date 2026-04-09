import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const body = (await req.json()) as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400, headers },
      );
    }

    const { email } = parsed.data;

    // Upsert — idempotent
    const subscriber = await prisma.statusSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // Send confirmation email
    const statusUrl =
      process.env.NEXT_PUBLIC_STATUS_URL ?? "https://status.gatectr.com";
    const unsubUrl = `${statusUrl}/unsubscribe?token=${subscriber.token}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "GateCtr <hello@gatectr.com>",
      to: email,
      subject: "You're subscribed to GateCtr status updates",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a202c;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Gate<span style="color: #00b4c8;">C</span>tr</span>
          </div>
          <h1 style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">You're subscribed to status updates</h1>
          <p style="font-size: 14px; color: #4a5568; line-height: 1.6; margin: 0 0 24px;">
            We'll notify you by email whenever there's an incident or scheduled maintenance affecting GateCtr services.
          </p>
          <a href="${statusUrl}" style="display: inline-block; background: #1b4f82; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;">
            View status page
          </a>
          <p style="font-size: 12px; color: #a0aec0; margin-top: 32px;">
            Don't want these emails? <a href="${unsubUrl}" style="color: #a0aec0;">Unsubscribe</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true }, { headers });
  } catch {
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers },
    );
  }
}
