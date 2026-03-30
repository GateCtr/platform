import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  code: z.string().min(1),
  email: z.string().email().optional(),
});

/**
 * Validates a waitlist invite code (and optionally that it matches an email).
 * Used by the custom sign-up page before Clerk account creation.
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { code, email } = bodySchema.parse(json);

    const entry = await prisma.waitlistEntry.findFirst({
      where: { inviteCode: code },
    });

    if (!entry) {
      return NextResponse.json({ valid: false, reason: "not_found" as const });
    }

    if (entry.status !== "INVITED") {
      return NextResponse.json({ valid: false, reason: "used" as const });
    }

    if (entry.inviteExpiresAt && entry.inviteExpiresAt < new Date()) {
      return NextResponse.json({ valid: false, reason: "expired" as const });
    }

    if (email && entry.email.toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json({
        valid: false,
        reason: "email_mismatch" as const,
      });
    }

    return NextResponse.json({ valid: true as const });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    console.error("waitlist invite verify:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
