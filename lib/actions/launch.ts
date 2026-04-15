"use server";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function requireAnalyticsRead() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const ok = await hasPermission(user.id, "analytics:read");
  if (!ok) throw new Error("Forbidden");
  return user;
}

// ─── 1.1 Referral Sources ─────────────────────────────────────────────────────

export interface ReferralStat {
  source: string;
  count: number;
  percentage: number;
  last24h: number;
}

export async function getReferralStats(): Promise<ReferralStat[]> {
  await requireAnalyticsRead();

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { metadata: true, createdAt: true },
  });

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const counts: Record<string, { total: number; last24h: number }> = {};

  for (const u of users) {
    const meta = (u.metadata ?? {}) as Record<string, unknown>;
    const source =
      typeof meta.ref === "string" && meta.ref.trim()
        ? meta.ref.trim()
        : "direct";

    if (!counts[source]) counts[source] = { total: 0, last24h: 0 };
    counts[source].total++;
    if (u.createdAt >= cutoff) counts[source].last24h++;
  }

  const total = users.length || 1;

  return Object.entries(counts)
    .map(([source, { total: count, last24h }]) => ({
      source,
      count,
      percentage: Math.round((count / total) * 100),
      last24h,
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── 1.2 Email Campaign Stats ─────────────────────────────────────────────────

export interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export async function getEmailCampaignStats(
  template: string,
): Promise<CampaignStats> {
  await requireAnalyticsRead();

  const logs = await prisma.emailLog.findMany({
    where: { template },
    select: { status: true, openedAt: true, clickedAt: true },
  });

  const sent = logs.length;
  const opened = logs.filter((l) => l.openedAt !== null).length;
  const clicked = logs.filter((l) => l.clickedAt !== null).length;
  const bounced = logs.filter((l) => l.status === "BOUNCED").length;
  const base = Math.max(sent, 1);

  return {
    sent,
    opened,
    clicked,
    bounced,
    openRate: Math.round((opened / base) * 100),
    clickRate: Math.round((clicked / base) * 100),
    bounceRate: Math.round((bounced / base) * 100),
  };
}

// ─── 1.3 Milestone Notifications ─────────────────────────────────────────────

const MILESTONES = [10, 50, 100, 250, 500, 1000];
const REDIS_KEY = (source: string) => `launch:milestone:${source}`;

export async function checkAndNotifyMilestone(source: string): Promise<void> {
  const slackUrl = process.env.SLACK_LAUNCH_WEBHOOK_URL;
  if (!slackUrl) return;

  try {
    // Count signups from this source
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { metadata: true },
    });

    const count = users.filter((u) => {
      const meta = (u.metadata ?? {}) as Record<string, unknown>;
      return meta.ref === source;
    }).length;

    // Get last notified milestone from Redis
    const lastRaw = await redis.get<number>(REDIS_KEY(source));
    const lastMilestone = lastRaw ?? 0;

    // Find the highest milestone we've crossed but not yet notified
    const nextMilestone = MILESTONES.find(
      (m) => count >= m && m > lastMilestone,
    );
    if (!nextMilestone) return;

    // Send Slack notification
    const totalUsers = users.length;
    const payload = {
      text: `🚀 *GateCtr — ${count} signups from ${source}!*\nMilestone: *${nextMilestone}* reached\nTotal users: ${totalUsers}`,
    };

    await fetch(slackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Update last notified milestone
    await redis.set(REDIS_KEY(source), nextMilestone);

    console.log(
      `[launch] Milestone ${nextMilestone} notified for source: ${source}`,
    );
  } catch (err) {
    // Non-fatal — don't break the signup flow
    console.error("[launch] Failed to check milestone:", err);
  }
}

// ─── 1.4 Promo Redemption Stats ───────────────────────────────────────────────

export interface PromoStats {
  code: string;
  redemptions: number;
  revenue: number; // in cents
}

export async function getPromoRedemptionStats(
  code: string,
): Promise<PromoStats> {
  await requireAnalyticsRead();

  const logs = await prisma.emailLog.findMany({
    where: { template: "promo-redemption", subject: { contains: code } },
    select: { id: true },
  });

  // Revenue: count active non-FREE subscriptions created after launch
  // (approximation — Stripe webhook logs redemptions)
  const launchDate = process.env.LAUNCH_DATE
    ? new Date(process.env.LAUNCH_DATE)
    : new Date("2026-04-15T00:00:00Z");

  const upgrades = await prisma.subscription.count({
    where: {
      status: "ACTIVE",
      plan: { name: { not: "FREE" } },
      createdAt: { gte: launchDate },
    },
  });

  return {
    code,
    redemptions: logs.length,
    revenue: upgrades * 2900, // approximate: assume PRO plan
  };
}
