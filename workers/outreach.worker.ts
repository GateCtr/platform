import { Worker, type Job } from "bullmq";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/prisma";
import { redisConnection, type OutreachFollowupJobData } from "@/lib/queues";

const SKIPPED_STATUSES = ["REFUSED", "UNSUBSCRIBED"] as const;

/**
 * Internal email send logic for outreach follow-ups.
 * This is a stub that will be replaced once lib/actions/outreach.ts (task 4)
 * implements the full sendEmail flow. The worker imports it dynamically so
 * that the circular dependency between the action layer and the worker is
 * avoided at module-load time.
 */
async function sendEmailInternal(
  prospectId: string,
  step: number,
): Promise<void> {
  // Dynamic import so the worker can be loaded before task 4 is implemented.
  // Once lib/actions/outreach.ts exports sendEmailInternal, this will resolve.
  const mod = await import("@/lib/actions/outreach").catch(() => null);

  if (mod && typeof mod.sendEmailInternal === "function") {
    await mod.sendEmailInternal(prospectId, step);
    return;
  }

  // Fallback: log a warning if the action module is not yet available.
  console.warn(
    "[outreach-worker] sendEmailInternal not yet implemented — skipping send",
    { prospectId, step },
  );
}

async function processJob(job: Job<OutreachFollowupJobData>): Promise<void> {
  const { type, prospectId, step } = job.data;

  // ─── Auto-refuse handler ────────────────────────────────────────────────
  if (type === "outreach_auto_refuse") {
    const prospect = await prisma.outreachProspect.findUnique({
      where: { id: prospectId },
      select: { id: true, status: true },
    });

    if (!prospect) {
      console.warn("[outreach-worker] auto-refuse: prospect not found", {
        prospectId,
      });
      return;
    }

    // Only refuse if still CONTACTED — don't overwrite REPLIED, CONVERTED, etc.
    if (prospect.status === "CONTACTED") {
      await prisma.outreachProspect.update({
        where: { id: prospectId },
        data: { status: "REFUSED" },
      });
      console.info("[outreach-worker] auto-refused prospect after no reply", {
        prospectId,
      });
    } else {
      console.info(
        "[outreach-worker] auto-refuse skipped — prospect status changed",
        {
          prospectId,
          status: prospect.status,
        },
      );
    }
    return;
  }

  // ─── Follow-up email handler ────────────────────────────────────────────
  const prospect = await prisma.outreachProspect.findUnique({
    where: { id: prospectId },
    select: { id: true, status: true, email: true },
  });

  if (!prospect) {
    console.warn("[outreach-worker] prospect not found — skipping", {
      jobId: job.id,
      prospectId,
      step,
    });
    return;
  }

  // Skip if prospect has opted out or refused
  if (
    SKIPPED_STATUSES.includes(
      prospect.status as (typeof SKIPPED_STATUSES)[number],
    )
  ) {
    console.info("[outreach-worker] prospect skipped due to status", {
      jobId: job.id,
      prospectId,
      status: prospect.status,
      step,
    });
    return;
  }

  await sendEmailInternal(prospectId, step);

  console.info("[outreach-worker] follow-up sent", {
    jobId: job.id,
    prospectId,
    step,
  });
}

export const outreachWorker = new Worker<OutreachFollowupJobData>(
  "outreach-followups",
  processJob,
  {
    connection: redisConnection,
    concurrency: 3,
    lockDuration: 30_000,
    skipVersionCheck: true,
  },
);

outreachWorker.on("failed", (job, err) => {
  const isFinalAttempt =
    job?.attemptsMade !== undefined &&
    job.opts?.attempts !== undefined &&
    job.attemptsMade >= job.opts.attempts;

  console.error("[outreach-worker] job failed", {
    jobId: job?.id,
    prospectId: job?.data?.prospectId,
    step: job?.data?.step,
    attemptsMade: job?.attemptsMade,
    isFinalAttempt,
    error: err.message,
  });

  // Report to Sentry only on final failure (after all retries exhausted)
  if (isFinalAttempt) {
    Sentry.captureException(err, {
      extra: {
        jobId: job?.id,
        prospectId: job?.data?.prospectId,
        step: job?.data?.step,
        attemptsMade: job?.attemptsMade,
      },
    });
  }
});

outreachWorker.on("completed", (job) => {
  console.debug("[outreach-worker] job completed", {
    jobId: job.id,
    prospectId: job.data.prospectId,
    step: job.data.step,
  });
});
