"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { resend } from "@/lib/resend";
import { outreachQueue } from "@/lib/queues";
import { appUrl } from "@/lib/app-url";
import { applyVariableSubstitution } from "@/lib/outreach-utils";
import { wrapOutreachEmail } from "@/lib/outreach-email-wrapper";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProspectStatus =
  | "NEW"
  | "CONTACTED"
  | "REPLIED"
  | "MEETING_BOOKED"
  | "CONVERTED"
  | "REFUSED"
  | "UNSUBSCRIBED";

export type ProspectTier = "TIER_1" | "TIER_2";

export interface OutreachStats {
  totalProspects: number;
  byStatus: Record<ProspectStatus, number>;
  byTier: Record<ProspectTier, number>;
  totalEmailsSent: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  conversionRate: number;
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const PROSPECT_STATUSES: ProspectStatus[] = [
  "NEW",
  "CONTACTED",
  "REPLIED",
  "MEETING_BOOKED",
  "CONVERTED",
  "REFUSED",
  "UNSUBSCRIBED",
];

const ProspectStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "REPLIED",
  "MEETING_BOOKED",
  "CONVERTED",
  "REFUSED",
  "UNSUBSCRIBED",
]);

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requireOutreachAccess(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const allowed = await hasPermission(user.id, "analytics:read");
  if (!allowed) throw new Error("Unauthorized");
  return user.id;
}

// ─── Variable substitution ────────────────────────────────────────────────────
// applyVariableSubstitution lives in lib/outreach-utils.ts (client-safe pure fn)

// ─── Read actions ─────────────────────────────────────────────────────────────

export async function getProspects() {
  await requireOutreachAccess();

  return prisma.outreachProspect.findMany({
    include: { emailLogs: true },
    orderBy: [{ tier: "asc" }, { createdAt: "desc" }],
  });
}

export async function getTemplates() {
  await requireOutreachAccess();

  return prisma.outreachTemplate.findMany({
    orderBy: { step: "asc" },
  });
}

export async function getStats(): Promise<OutreachStats> {
  await requireOutreachAccess();

  const [prospects, logs] = await Promise.all([
    prisma.outreachProspect.findMany({ select: { status: true, tier: true } }),
    prisma.outreachEmailLog.findMany({
      select: { status: true, openedAt: true, clickedAt: true },
    }),
  ]);

  const totalProspects = prospects.length;

  // byStatus
  const byStatus = Object.fromEntries(
    PROSPECT_STATUSES.map((s) => [s, 0]),
  ) as Record<ProspectStatus, number>;
  for (const p of prospects) {
    const s = p.status as ProspectStatus;
    if (s in byStatus) byStatus[s]++;
  }

  // byTier
  const byTier: Record<ProspectTier, number> = { TIER_1: 0, TIER_2: 0 };
  for (const p of prospects) {
    const t = p.tier as ProspectTier;
    if (t in byTier) byTier[t]++;
  }

  const totalEmailsSent = logs.length;
  const sentCount = Math.max(totalEmailsSent, 1);

  const openedCount = logs.filter((l) => l.openedAt !== null).length;
  const clickedCount = logs.filter((l) => l.clickedAt !== null).length;

  const repliedCount =
    byStatus.REPLIED + byStatus.MEETING_BOOKED + byStatus.CONVERTED;
  const contactedCount =
    byStatus.CONTACTED +
    byStatus.REPLIED +
    byStatus.MEETING_BOOKED +
    byStatus.CONVERTED;
  const contactedBase = Math.max(contactedCount, 1);

  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  return {
    totalProspects,
    byStatus,
    byTier,
    totalEmailsSent,
    openRate: clamp(openedCount / sentCount),
    clickRate: clamp(clickedCount / sentCount),
    replyRate: clamp(repliedCount / contactedBase),
    conversionRate: clamp(byStatus.CONVERTED / Math.max(totalProspects, 1)),
  };
}

// ─── Mutation actions ─────────────────────────────────────────────────────────

export async function updateProspectStatus(prospectId: string, status: string) {
  await requireOutreachAccess();

  const parsed = ProspectStatusSchema.safeParse(status);
  if (!parsed.success) {
    throw new Error(`Invalid status: ${status}`);
  }

  return prisma.outreachProspect.update({
    where: { id: prospectId },
    data: { status: parsed.data },
  });
}

export async function updateTemplate(
  step: number,
  data: {
    name?: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
  },
  category = "general",
) {
  await requireOutreachAccess();

  return prisma.outreachTemplate.update({
    where: { step_category: { step, category } },
    data,
  });
}

// ─── Internal send helper (shared with worker) ────────────────────────────────

export async function sendEmailInternal(
  prospectId: string,
  step: number,
  overrides?: { subject?: string; bodyHtml?: string },
): Promise<{ success: boolean; logId?: string; error?: string }> {
  const prospect = await prisma.outreachProspect.findUnique({
    where: { id: prospectId },
  });
  if (!prospect) return { success: false, error: "Prospect not found" };

  const template =
    (await prisma.outreachTemplate.findFirst({
      where: {
        step,
        category: prospect.templateCategory ?? "general",
      },
    })) ??
    (await prisma.outreachTemplate.findFirst({
      where: { step, category: "general" },
    }));
  if (!template)
    return { success: false, error: `Template for step ${step} not found` };

  const senderName = process.env.OUTREACH_SENDER_NAME ?? "GateCtr Team";
  const senderEmail =
    process.env.OUTREACH_SENDER_EMAIL ?? "outreach@gatectr.io";

  const subject = applyVariableSubstitution(
    overrides?.subject ?? template.subject,
    prospect,
    senderName,
  );

  const trackingId = randomUUID();
  const pixelUrl = appUrl(`/api/track/open/${trackingId}`);
  const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" />`;

  const rawHtml = overrides?.bodyHtml ?? template.bodyHtml;
  const substitutedHtml = applyVariableSubstitution(
    rawHtml,
    prospect,
    senderName,
  );

  // Wrap all href links for click tracking
  const trackedHtml = substitutedHtml.replace(
    /href="(https?:\/\/[^"]+)"/gi,
    (_, url: string) => {
      const trackUrl = appUrl(
        `/api/track/click/${trackingId}?url=${encodeURIComponent(url)}`,
      );
      return `href="${trackUrl}"`;
    },
  );

  const bodyHtml = await wrapOutreachEmail(
    trackedHtml + trackingPixel,
    prospect.email,
    subject,
  );

  let resendId: string | undefined;

  try {
    const result = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: prospect.email,
      subject,
      html: bodyHtml,
    });
    resendId = result.data?.id ?? undefined;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const log = await prisma.outreachEmailLog.create({
      data: {
        prospectId,
        subject,
        step,
        status: "FAILED",
        trackingId,
        sentAt: new Date(),
      },
    });
    return { success: false, logId: log.id, error: errorMsg };
  }

  const log = await prisma.outreachEmailLog.create({
    data: {
      prospectId,
      resendId,
      subject,
      step,
      status: "SENT",
      trackingId,
      sentAt: new Date(),
    },
  });

  // Update prospect status if NEW
  if (prospect.status === "NEW") {
    await prisma.outreachProspect.update({
      where: { id: prospectId },
      data: { status: "CONTACTED", lastContactedAt: new Date() },
    });
  } else {
    await prisma.outreachProspect.update({
      where: { id: prospectId },
      data: { lastContactedAt: new Date() },
    });
  }

  // Enqueue follow-up jobs (non-blocking — Redis failure must not fail the send)
  try {
    if (step === 1) {
      await outreachQueue.add(
        "followup",
        { type: "outreach_followup", prospectId, step: 2 },
        { delay: 3 * 24 * 60 * 60 * 1000 },
      );
    } else if (step === 2) {
      await outreachQueue.add(
        "followup",
        { type: "outreach_followup", prospectId, step: 3 },
        { delay: 7 * 24 * 60 * 60 * 1000 },
      );
    } else if (step === 3) {
      const AUTO_REFUSE_DAYS = 7;
      await outreachQueue.add(
        "auto-refuse",
        { type: "outreach_auto_refuse", prospectId, step: 3 },
        { delay: AUTO_REFUSE_DAYS * 24 * 60 * 60 * 1000 },
      );
    }
  } catch (queueErr) {
    // Queue failure is non-fatal — email was already sent successfully
    console.error("[outreach] Failed to enqueue follow-up job:", queueErr);
  }

  return { success: true, logId: log.id };
}

// ─── sendEmail server action ──────────────────────────────────────────────────

export async function sendEmail(
  prospectId: string,
  step: number,
  overrides?: { subject?: string; bodyHtml?: string },
): Promise<{ success: boolean; logId?: string; error?: string }> {
  await requireOutreachAccess();
  return sendEmailInternal(prospectId, step, overrides);
}

// ─── Bulk send ────────────────────────────────────────────────────────────────

const SKIP_STATUSES: ProspectStatus[] = ["REFUSED", "UNSUBSCRIBED"];
const BULK_RATE = 5; // emails per second

export async function bulkSendEmail(
  prospectIds: string[],
  step: number,
): Promise<{
  sent: number;
  failed: number;
  errors: Array<{ prospectId: string; reason: string }>;
}> {
  await requireOutreachAccess();

  const result = {
    sent: 0,
    failed: 0,
    errors: [] as Array<{ prospectId: string; reason: string }>,
  };

  for (let i = 0; i < prospectIds.length; i++) {
    const prospectId = prospectIds[i];

    // Rate limit: pause 1s every BULK_RATE emails
    if (i > 0 && i % BULK_RATE === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Check status before sending
    const prospect = await prisma.outreachProspect.findUnique({
      where: { id: prospectId },
      select: { status: true },
    });

    if (!prospect) {
      result.failed++;
      result.errors.push({ prospectId, reason: "not found" });
      continue;
    }

    if (SKIP_STATUSES.includes(prospect.status as ProspectStatus)) {
      result.failed++;
      result.errors.push({ prospectId, reason: "skipped" });
      continue;
    }

    const res = await sendEmailInternal(prospectId, step);
    if (res.success) {
      result.sent++;
    } else {
      result.failed++;
      result.errors.push({ prospectId, reason: res.error ?? "unknown error" });
    }
  }

  return result;
}

// ─── Delete prospect ──────────────────────────────────────────────────────────

export async function deleteProspect(
  prospectId: string,
): Promise<{ success: boolean }> {
  await requireOutreachAccess();

  // Cancel any pending follow-up jobs first
  try {
    const jobs = await outreachQueue.getJobs(["delayed", "waiting"]);
    for (const job of jobs) {
      const data = job.data as { prospectId?: string };
      if (data.prospectId === prospectId) {
        await job.remove();
      }
    }
  } catch (err) {
    console.error("[outreach] Failed to cancel jobs before delete:", err);
  }

  // Delete logs then prospect (cascade should handle it but explicit is safer)
  await prisma.outreachEmailLog.deleteMany({ where: { prospectId } });
  await prisma.outreachProspect.delete({ where: { id: prospectId } });

  return { success: true };
}

export async function cancelFollowups(
  prospectId: string,
): Promise<{ cancelled: number }> {
  await requireOutreachAccess();

  let cancelled = 0;
  try {
    // Get all delayed/waiting jobs for this prospect
    const jobs = await outreachQueue.getJobs(["delayed", "waiting"]);
    for (const job of jobs) {
      const data = job.data as { prospectId?: string };
      if (data.prospectId === prospectId) {
        await job.remove();
        cancelled++;
      }
    }
  } catch (err) {
    console.error("[outreach] Failed to cancel follow-up jobs:", err);
  }

  // Mark prospect as REFUSED to prevent future sends
  await prisma.outreachProspect.update({
    where: { id: prospectId },
    data: { status: "REFUSED" },
  });

  return { cancelled };
}

export async function scheduleFollowup(
  prospectId: string,
  step: number,
  delayDays: number,
): Promise<void> {
  await requireOutreachAccess();

  try {
    await outreachQueue.add(
      "followup",
      { type: "outreach_followup", prospectId, step },
      { delay: delayDays * 24 * 60 * 60 * 1000 },
    );
  } catch (err) {
    console.error("[outreach] Failed to schedule follow-up:", err);
  }
}

// ─── Create prospect ──────────────────────────────────────────────────────────

const CreateProspectSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().min(1),
  jobTitle: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  tier: z.enum(["TIER_1", "TIER_2"]),
  notes: z.string().optional(),
});

export async function createProspect(
  data: z.infer<typeof CreateProspectSchema>,
) {
  await requireOutreachAccess();

  const parsed = CreateProspectSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid prospect data");

  const { website, linkedinUrl, ...rest } = parsed.data;

  const existing = await prisma.outreachProspect.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing)
    throw new Error(
      `A prospect with email ${parsed.data.email} already exists`,
    );

  return prisma.outreachProspect.create({
    data: {
      ...rest,
      website: website || null,
      linkedinUrl: linkedinUrl || null,
      status: "NEW",
      tags: [],
    },
    include: { emailLogs: true },
  });
}

// ─── Import prospects from CSV ────────────────────────────────────────────────

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

export async function importProspectsFromCsv(
  rows: Array<Record<string, string>>,
): Promise<CsvImportResult> {
  await requireOutreachAccess();

  const result: CsvImportResult = { imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const parsed = CreateProspectSchema.safeParse({
      email: row.email?.trim(),
      firstName: row.firstName?.trim() || row.first_name?.trim(),
      lastName: row.lastName?.trim() || row.last_name?.trim(),
      company: row.company?.trim(),
      jobTitle: row.jobTitle?.trim() || row.job_title?.trim() || undefined,
      website: row.website?.trim() || undefined,
      linkedinUrl:
        row.linkedinUrl?.trim() || row.linkedin_url?.trim() || undefined,
      tier:
        row.tier?.trim().toUpperCase() === "TIER_1" || row.tier?.trim() === "1"
          ? "TIER_1"
          : "TIER_2",
      notes: row.notes?.trim() || undefined,
    });

    if (!parsed.success) {
      result.errors.push({
        row: i + 2,
        reason: parsed.error.issues[0]?.message ?? "Invalid data",
      });
      result.skipped++;
      continue;
    }

    try {
      const { website, linkedinUrl, ...rest } = parsed.data;
      await prisma.outreachProspect.upsert({
        where: { email: parsed.data.email },
        create: {
          ...rest,
          website: website || null,
          linkedinUrl: linkedinUrl || null,
          status: "NEW",
          tags: [],
        },
        update: {},
      });
      result.imported++;
    } catch {
      result.errors.push({ row: i + 2, reason: "Duplicate or DB error" });
      result.skipped++;
    }
  }

  return result;
}
