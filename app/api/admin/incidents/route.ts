import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { resend } from "@/lib/resend";
import { z } from "zod";
import { IncidentStatus, IncidentImpact } from "@prisma/client";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  status: z.nativeEnum(IncidentStatus).default("INVESTIGATING"),
  impact: z.nativeEnum(IncidentImpact).default("MINOR"),
  services: z.array(z.string()).default([]),
});

async function requireSystemWrite() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const can = await hasPermission(user.id, "system:write");
  return can ? user : null;
}

// ─── GET — list incidents ─────────────────────────────────────────────────────

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const can = await hasPermission(user.id, "system:read");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const incidents = await prisma.incident.findMany({
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ incidents });
}

// ─── POST — create incident + notify subscribers ──────────────────────────────

export async function POST(req: NextRequest) {
  const user = await requireSystemWrite();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const incident = await prisma.incident.create({ data: parsed.data });

  // Notify subscribers async (fire and forget)
  void notifySubscribers(incident).catch(console.error);

  return NextResponse.json({ incident }, { status: 201 });
}

// ─── Notify subscribers ───────────────────────────────────────────────────────

async function notifySubscribers(incident: {
  title: string;
  description: string;
  status: string;
  impact: string;
}) {
  const subscribers = await prisma.statusSubscriber.findMany({
    select: { email: true },
  });
  if (subscribers.length === 0) return;

  const statusUrl =
    process.env.NEXT_PUBLIC_STATUS_URL ?? "https://status.gatectr.com";
  const impactColor =
    incident.impact === "CRITICAL"
      ? "#e53e3e"
      : incident.impact === "MAJOR"
        ? "#dd6b20"
        : "#d69e2e";

  const emails = subscribers.map((s) => s.email);

  // Batch in groups of 50 (Resend limit)
  for (let i = 0; i < emails.length; i += 50) {
    const batch = emails.slice(i, i + 50);
    await Promise.allSettled(
      batch.map((email) =>
        resend.emails.send({
          from: process.env.EMAIL_FROM ?? "GateCtr <hello@gatectr.com>",
          to: email,
          subject: `[GateCtr Status] ${incident.title}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a202c;">
              <div style="margin-bottom: 24px;">
                <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Gate<span style="color: #00b4c8;">C</span>tr</span>
              </div>
              <div style="display: inline-block; background: ${impactColor}20; color: ${impactColor}; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${incident.impact} — ${incident.status}
              </div>
              <h1 style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">${incident.title}</h1>
              <p style="font-size: 14px; color: #4a5568; line-height: 1.6; margin: 0 0 24px;">${incident.description}</p>
              <a href="${statusUrl}" style="display: inline-block; background: #1b4f82; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;">
                View status page
              </a>
            </div>
          `,
        }),
      ),
    );
  }
}
