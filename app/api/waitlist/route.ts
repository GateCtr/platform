import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendWelcomeWaitlistEmail } from "@/lib/resend";
import { isAdmin } from "@/lib/auth";
import { redis } from "@/lib/redis";

// ─── Rate limit: 3 submissions per IP per hour ────────────────────────────────
async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `waitlist:rl:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 3600);
  return count <= 3;
}

const waitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  company: z.string().optional(),
  useCase: z.enum(["saas", "agent", "enterprise", "dev"]).optional(),
  referralCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check if waitlist is enabled
    if (process.env.ENABLE_WAITLIST !== "true") {
      return NextResponse.json(
        { error: "Waitlist is not currently active" },
        { status: 403 },
      );
    }

    // Rate limit check
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validatedData = waitlistSchema.parse(body);

    // Get IP and User Agent for tracking
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Check if email already exists
    const existing = await prisma.waitlistEntry.findUnique({
      where: { email: validatedData.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered", position: existing.position },
        { status: 409 },
      );
    }

    // Resolve referrer if a referral code was provided
    let referredById: string | null = null;
    if (validatedData.referralCode) {
      const referrer = await prisma.waitlistEntry.findFirst({
        where: { referralCode: validatedData.referralCode },
        select: { id: true },
      });
      if (referrer) referredById = referrer.id;
    }

    // Generate a unique referral code for this new entry
    const { nanoid } = await import("nanoid");
    const newReferralCode = nanoid(8);

    // Create waitlist entry
    const entry = await prisma.waitlistEntry.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        company: validatedData.company,
        useCase: validatedData.useCase,
        ipAddress,
        userAgent,
        referralCode: newReferralCode,
        referredBy: referredById,
      },
    });

    // Send welcome email (async, don't wait)
    sendWelcomeWaitlistEmail(entry.email, entry.name, entry.position).catch(
      (err) => console.error("Failed to send welcome email:", err),
    );

    return NextResponse.json({
      success: true,
      position: entry.position,
      referralCode: entry.referralCode,
      message: "Successfully joined the waitlist",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status") as
      | "WAITING"
      | "INVITED"
      | "JOINED"
      | null;
    const search = searchParams.get("search")?.trim() || null;
    const exportCsv = searchParams.get("export") === "csv";

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" as const } },
              { name: { contains: search, mode: "insensitive" as const } },
              { company: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    // ── CSV export ────────────────────────────────────────────────────────────
    if (exportCsv) {
      const all = await prisma.waitlistEntry.findMany({
        where,
        orderBy: { position: "asc" },
        select: {
          position: true,
          email: true,
          name: true,
          company: true,
          useCase: true,
          status: true,
          referralCode: true,
          createdAt: true,
          invitedAt: true,
          joinedAt: true,
        },
      });

      const header = "position,email,name,company,useCase,status,referralCode,createdAt,invitedAt,joinedAt";
      const rows = all.map((e) =>
        [
          e.position,
          `"${e.email}"`,
          `"${e.name ?? ""}"`,
          `"${e.company ?? ""}"`,
          e.useCase ?? "",
          e.status,
          e.referralCode ?? "",
          e.createdAt.toISOString(),
          e.invitedAt?.toISOString() ?? "",
          e.joinedAt?.toISOString() ?? "",
        ].join(","),
      );

      const csv = [header, ...rows].join("\n");
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const [entries, total] = await Promise.all([
      prisma.waitlistEntry.findMany({
        where,
        orderBy: { position: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.waitlistEntry.count({ where }),
    ]);

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Waitlist fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const { id, action } = await request.json() as { id: string; action: "delete" | "skip" };

    if (!id) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
    }

    const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (action === "skip") {
      // Blacklist: mark as SKIPPED without deleting (keeps the email blocked from re-registering)
      await prisma.waitlistEntry.update({
        where: { id },
        data: { status: "SKIPPED" },
      });
      return NextResponse.json({ success: true, action: "skipped" });
    }

    // Hard delete
    await prisma.waitlistEntry.delete({ where: { id } });
    return NextResponse.json({ success: true, action: "deleted" });
  } catch (error) {
    console.error("Waitlist delete error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
