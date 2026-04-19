import { Worker, type Job } from "bullmq";
import { render } from "@react-email/render";
import * as Sentry from "@sentry/nextjs";
import { emailSubject } from "@/lib/email-subjects";
import { redisConnection, type EmailJobData } from "@/lib/queues.worker";
import TeamInvitationEmail from "@/components/emails/team-invitation";

const FROM = process.env.EMAIL_FROM ?? "GateCtr <noreply@gatectr.io>";

async function processJob(job: Job<EmailJobData>): Promise<void> {
  const data = job.data;

  if (data.type === "team_invitation") {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY!);

    const locale = data.locale ?? "en";
    const html = await render(
      TeamInvitationEmail({
        email: data.to,
        inviteeName: data.inviteeName,
        inviterName: data.inviterName,
        teamName: data.teamName,
        role: data.role,
        acceptUrl: data.acceptUrl,
        expiryDays: data.expiryDays ?? 7,
        locale,
      }),
    );

    const subject = emailSubject(locale, "teamInvitation", {
      inviter: data.inviterName,
      team: data.teamName,
    });

    const result = await resend.emails.send({
      from: FROM,
      to: data.to,
      subject,
      html,
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    console.info("[email-worker] team_invitation sent", {
      jobId: job.id,
      to: data.to,
      teamName: data.teamName,
      resendId: result.data?.id,
    });

    return;
  }

  console.warn("[email-worker] unknown job type", {
    type: (data as EmailJobData).type,
  });
}

export const emailWorker = new Worker<EmailJobData>("emails", processJob, {
  connection: redisConnection,
  concurrency: 5,
  lockDuration: 30_000,
  skipVersionCheck: true,
});

emailWorker.on("failed", (job, err) => {
  console.error("[email-worker] job failed", {
    jobId: job?.id,
    type: job?.data?.type,
    to: job?.data?.to,
    attemptsMade: job?.attemptsMade,
    error: err.message,
  });
  Sentry.captureException(err, {
    extra: { jobId: job?.id, type: job?.data?.type, to: job?.data?.to },
  });
});

emailWorker.on("completed", (job) => {
  console.debug("[email-worker] job completed", {
    jobId: job.id,
    type: job.data.type,
  });
});
