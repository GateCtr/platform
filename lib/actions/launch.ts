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

    // Avoid log injection — don't interpolate user-provided values directly
    console.log("[launch] Milestone notified", { milestone: nextMilestone });
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

// ─── 2.1 Conversion Funnel ────────────────────────────────────────────────────

export interface FunnelStep {
  label: string;
  count: number;
  rate: number; // % of previous step
}

export interface FunnelBySource {
  source: string;
  steps: FunnelStep[];
}

export async function getConversionFunnel(
  since?: Date,
): Promise<FunnelBySource[]> {
  await requireAnalyticsRead();

  const launchDate =
    since ??
    (process.env.LAUNCH_DATE
      ? new Date(process.env.LAUNCH_DATE)
      : new Date("2026-04-15T00:00:00Z"));

  const users = await prisma.user.findMany({
    where: { isActive: true, createdAt: { gte: launchDate } },
    select: { id: true, metadata: true, createdAt: true },
  });

  // Group by source
  const bySource: Record<string, string[]> = {};
  for (const u of users) {
    const meta = (u.metadata ?? {}) as Record<string, unknown>;
    const source =
      typeof meta.ref === "string" && meta.ref.trim()
        ? meta.ref.trim()
        : "direct";
    (bySource[source] ??= []).push(u.id);
  }

  const results: FunnelBySource[] = [];

  for (const [source, userIds] of Object.entries(bySource)) {
    const signups = userIds.length;

    // Step 2: onboarding completed
    const onboarded = await prisma.user.count({
      where: {
        id: { in: userIds },
        metadata: { path: ["onboardingComplete"], equals: true },
      },
    });

    // Step 3: first API call
    const activated = await prisma.usageLog.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { _all: true },
    });
    const activatedCount = activated.length;

    // Step 4: plan upgrade
    const upgraded = await prisma.subscription.count({
      where: {
        userId: { in: userIds },
        plan: { name: { not: "FREE" } },
        status: "ACTIVE",
      },
    });

    const pct = (n: number, d: number) =>
      d === 0 ? 0 : Math.round((n / d) * 100);

    results.push({
      source,
      steps: [
        { label: "Signed up", count: signups, rate: 100 },
        {
          label: "Onboarded",
          count: onboarded,
          rate: pct(onboarded, signups),
        },
        {
          label: "First API call",
          count: activatedCount,
          rate: pct(activatedCount, signups),
        },
        {
          label: "Upgraded",
          count: upgraded,
          rate: pct(upgraded, signups),
        },
      ],
    });
  }

  return results.sort((a, b) => b.steps[0].count - a.steps[0].count);
}

// ─── 2.2 Cohort Analysis ─────────────────────────────────────────────────────

export interface CohortRow {
  week: string; // "2026-W15"
  source: string;
  signups: number;
  retention: number[]; // % retained at week+1, week+2, week+4
}

export async function getCohortRetention(): Promise<CohortRow[]> {
  await requireAnalyticsRead();

  const launchDate = process.env.LAUNCH_DATE
    ? new Date(process.env.LAUNCH_DATE)
    : new Date("2026-04-15T00:00:00Z");

  const users = await prisma.user.findMany({
    where: { isActive: true, createdAt: { gte: launchDate } },
    select: { id: true, metadata: true, createdAt: true },
  });

  // Group by ISO week + source
  const cohorts: Record<
    string,
    { source: string; week: string; userIds: string[]; weekStart: Date }
  > = {};

  for (const u of users) {
    const meta = (u.metadata ?? {}) as Record<string, unknown>;
    const source =
      typeof meta.ref === "string" && meta.ref.trim()
        ? meta.ref.trim()
        : "direct";
    const week = getISOWeek(u.createdAt);
    const key = `${week}::${source}`;
    if (!cohorts[key]) {
      cohorts[key] = {
        source,
        week,
        userIds: [],
        weekStart: startOfISOWeek(u.createdAt),
      };
    }
    cohorts[key].userIds.push(u.id);
  }

  const rows: CohortRow[] = [];

  for (const cohort of Object.values(cohorts)) {
    const { userIds, weekStart } = cohort;
    const signups = userIds.length;

    const retentionWeeks = [1, 2, 4];
    const retention: number[] = [];

    for (const w of retentionWeeks) {
      const start = new Date(weekStart.getTime() + w * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      if (start > now) {
        retention.push(-1); // future — not yet measurable
        continue;
      }
      const active = await prisma.usageLog.groupBy({
        by: ["userId"],
        where: {
          userId: { in: userIds },
          createdAt: { gte: start, lt: end },
        },
      });
      retention.push(
        signups === 0 ? 0 : Math.round((active.length / signups) * 100),
      );
    }

    rows.push({ week: cohort.week, source: cohort.source, signups, retention });
  }

  return rows.sort((a, b) => a.week.localeCompare(b.week));
}

// ─── 2.3 Signups time series ──────────────────────────────────────────────────

export interface SignupPoint {
  date: string; // YYYY-MM-DD
  total: number;
  bySource: Record<string, number>;
}

export async function getSignupTimeSeries(days = 30): Promise<SignupPoint[]> {
  await requireAnalyticsRead();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: { isActive: true, createdAt: { gte: since } },
    select: { metadata: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const map: Record<string, Record<string, number>> = {};

  for (const u of users) {
    const day = u.createdAt.toISOString().slice(0, 10);
    const meta = (u.metadata ?? {}) as Record<string, unknown>;
    const source =
      typeof meta.ref === "string" && meta.ref.trim()
        ? meta.ref.trim()
        : "direct";
    if (!map[day]) map[day] = {};
    map[day][source] = (map[day][source] ?? 0) + 1;
  }

  // Fill gaps
  const points: SignupPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const date = d.toISOString().slice(0, 10);
    const bySource = map[date] ?? {};
    const total = Object.values(bySource).reduce((a, b) => a + b, 0);
    points.push({ date, total, bySource });
  }

  return points;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function startOfISOWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
