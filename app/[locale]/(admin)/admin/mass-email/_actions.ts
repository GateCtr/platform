"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { sendLaunchAnnouncementEmail } from "@/lib/resend";

const RATE_DELAY_MS = 120;
const BATCH_SIZE = 10;

async function requireEmailPermission() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const allowed = await hasPermission(user.clerkId, "users:write");
  if (!allowed) throw new Error("Forbidden: users:write required");
  return user;
}

export interface MassEmailRecipient {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  locale: "en" | "fr";
  createdAt: string;
}

export async function getEmailRecipients(): Promise<MassEmailRecipient[]> {
  await requireEmailPermission();

  const users = await prisma.user.findMany({
    where: { isActive: true, isBanned: false },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => {
    const meta = (u.metadata ?? {}) as Record<string, unknown>;
    const locale =
      typeof meta.locale === "string" && meta.locale === "fr" ? "fr" : "en";
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      plan: u.plan,
      locale,
      createdAt: u.createdAt.toISOString(),
    };
  });
}

export interface SendResult {
  sent: number;
  failed: number;
  skipped: number;
  errors: Array<{ email: string; reason: string }>;
}

export async function sendLaunchEmailBatch(
  recipientIds: string[],
): Promise<SendResult> {
  await requireEmailPermission();

  const result: SendResult = {
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  if (recipientIds.length === 0) return result;

  const users = await prisma.user.findMany({
    where: {
      id: { in: recipientIds },
      isActive: true,
      isBanned: false,
    },
    select: { id: true, email: true, name: true, metadata: true },
  });

  for (let i = 0; i < users.length; i++) {
    const u = users[i];

    if (i > 0 && i % BATCH_SIZE === 0) {
      await new Promise((r) => setTimeout(r, 1000));
    } else if (i > 0) {
      await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
    }

    const meta = (u.metadata ?? {}) as Record<string, unknown>;
    const locale: "en" | "fr" =
      typeof meta.locale === "string" && meta.locale === "fr" ? "fr" : "en";

    const res = await sendLaunchAnnouncementEmail(u.email, u.name, locale);

    if (res.success) {
      result.sent++;

      await prisma.emailLog.create({
        data: {
          userId: u.id,
          resendId: (res as { resendId?: string }).resendId ?? undefined,
          to: u.email,
          subject: "🚀 GateCtr is live on Product Hunt — exclusive offer inside",
          template: "launch-announcement",
          status: "SENT",
        },
      });
    } else {
      result.failed++;
      result.errors.push({
        email: u.email,
        reason: String((res as { error?: unknown }).error ?? "Unknown error"),
      });
    }
  }

  return result;
}
