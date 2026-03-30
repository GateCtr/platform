import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail, sendBetaCouponEmail } from "@/lib/resend";
import { isAdmin } from "@/lib/auth";
import { normalizeLocale } from "@/lib/user-locale";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { stripe } from "@/lib/stripe";

const BETA_LIMIT = 100;

async function createBetaPromoCode(email: string): Promise<string> {
  const coupon = await stripe.coupons.create({
    name: "Beta — Pro 1 month free",
    percent_off: 100,
    duration: "repeating",
    duration_in_months: 1,
    max_redemptions: 1,
  });

  const customers = await stripe.customers.list({ email, limit: 1 });
  const customerId = customers.data[0]?.id;

  const promoParams: Parameters<typeof stripe.promotionCodes.create>[0] = {
    promotion: { type: "coupon", coupon: coupon.id },
    max_redemptions: 1,
    restrictions: { first_time_transaction: true },
  };
  if (customerId) promoParams.customer = customerId;

  const promo = await stripe.promotionCodes.create(promoParams);
  return promo.code;
}

const inviteSchema = z.object({
  entryIds: z.array(z.string()).min(1, "At least one entry must be selected"),
  expiryDays: z.number().min(1).max(30).default(7),
});

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { entryIds, expiryDays } = inviteSchema.parse(body);

    // ── Rate limit: 30 admin actions/min ─────────────────────────────────────
    const { userId } = await import("@clerk/nextjs/server").then((m) =>
      m.auth(),
    );
    if (userId) {
      const rl = await rateLimit(userId, RATE_LIMITS.admin);
      if (!rl.allowed) return rateLimitResponse(rl);
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    // Process each entry
    for (const entryId of entryIds) {
      try {
        const entry = await prisma.waitlistEntry.findUnique({
          where: { id: entryId },
        });

        if (!entry) {
          results.failed.push({ id: entryId, error: "Entry not found" });
          continue;
        }

        if (entry.status !== "WAITING") {
          results.failed.push({
            id: entryId,
            error: `Already ${entry.status.toLowerCase()}`,
          });
          continue;
        }

        // Generate unique invite code
        const inviteCode = nanoid(16);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        // Update entry
        await prisma.waitlistEntry.update({
          where: { id: entryId },
          data: {
            status: "INVITED",
            inviteCode,
            invitedAt: new Date(),
            inviteExpiresAt: expiresAt,
          },
        });

        // Beta users (position <= 100): create Stripe promo code + send beta email
        // Regular users: send standard invite email
        if (entry.position <= BETA_LIMIT) {
          try {
            const couponCode = await createBetaPromoCode(entry.email);
            await prisma.waitlistEntry.update({
              where: { id: entryId },
              data: {
                betaCouponCode: couponCode,
                betaCouponSentAt: new Date(),
              },
            });
            sendBetaCouponEmail(
              entry.email,
              entry.name,
              couponCode,
              inviteCode,
              entry.position,
              normalizeLocale(entry.locale),
            ).catch((err) =>
              console.error(`[beta-coupon] Failed for ${entry.email}:`, err),
            );
          } catch (err) {
            // Coupon creation failed — fall back to standard invite
            console.error(
              `[beta-coupon] Stripe error for ${entry.email}:`,
              err,
            );
            sendInviteEmail(
              entry.email,
              entry.name,
              inviteCode,
              expiresAt,
              expiryDays,
              normalizeLocale(entry.locale),
            ).catch((e) =>
              console.error(`Failed to send invite to ${entry.email}:`, e),
            );
          }
        } else {
          sendInviteEmail(
            entry.email,
            entry.name,
            inviteCode,
            expiresAt,
            expiryDays,
            normalizeLocale(entry.locale),
          ).catch((err) =>
            console.error(`Failed to send invite to ${entry.email}:`, err),
          );
        }

        results.success.push(entryId);
      } catch (error) {
        console.error(`Failed to invite entry ${entryId}:`, error);
        results.failed.push({
          id: entryId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      invited: results.success.length,
      failed: results.failed.length,
      details: results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Failed to send invites" },
      { status: 500 },
    );
  }
}
