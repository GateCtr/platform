import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const redeemSchema = z.object({
  inviteCode: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteCode } = redeemSchema.parse(body);

    const entry = await prisma.waitlistEntry.findUnique({
      where: { inviteCode },
    });

    if (!entry) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    if (entry.status === "JOINED") {
      return NextResponse.json({ error: "Invite already used" }, { status: 409 });
    }

    if (entry.status !== "INVITED") {
      return NextResponse.json({ error: "Invite not valid" }, { status: 400 });
    }

    if (entry.inviteExpiresAt && entry.inviteExpiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: { status: "JOINED", joinedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      email: entry.email,
      name: entry.name,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    console.error("Redeem error:", error);
    return NextResponse.json({ error: "Failed to redeem invite" }, { status: 500 });
  }
}
