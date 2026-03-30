import { Resend } from "resend";
import { render } from "@react-email/render";
import { emailSubject } from "@/lib/email-subjects";
import WaitlistWelcomeEmail from "@/components/emails/waitlist-welcome";
import WaitlistInviteEmail from "@/components/emails/waitlist-invite";
import UserWelcomeEmail from "@/components/emails/user-welcome";

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not defined");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return getResend()[prop as keyof Resend];
  },
});

export async function sendWelcomeWaitlistEmail(
  email: string,
  name: string | null,
  position: number,
  locale: "en" | "fr" = "en",
) {
  try {
    const emailHtml = await render(
      WaitlistWelcomeEmail({
        email,
        name: name || undefined,
        position,
        locale,
      }),
    );

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "waitlistWelcome", {
        position: String(position),
      }),
      html: emailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send waitlist email:", error);
    return { success: false, error };
  }
}

export async function sendInviteEmail(
  email: string,
  name: string | null,
  inviteCode: string,
  expiresAt: Date,
  expiryDays: number = 7,
  locale: "en" | "fr" = "en",
) {
  try {
    const emailHtml = await render(
      WaitlistInviteEmail({
        email,
        name: name || undefined,
        inviteCode,
        expiresAt,
        expiryDays,
        locale,
      }),
    );

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "waitlistInvite"),
      html: emailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send invite email:", error);
    return { success: false, error };
  }
}

/**
 * Send welcome email to newly registered user
 * @param email - User's email address
 * @param name - User's name (optional)
 * @param locale - User's preferred locale (en or fr)
 * @returns Promise with success status
 */
export async function sendUserWelcomeEmail(
  email: string,
  name: string | null,
  locale: "en" | "fr" = "en",
) {
  try {
    const emailHtml = await render(
      UserWelcomeEmail({
        email,
        name: name || undefined,
        locale,
      }),
    );

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "userWelcome"),
      html: emailHtml,
    });

    return { success: true, resendId: result.data?.id };
  } catch (error) {
    console.error("Failed to send user welcome email:", error);
    return { success: false, error };
  }
}

export async function sendBetaCouponEmail(
  email: string,
  name: string | null,
  couponCode: string,
  inviteCode: string,
  position: number,
  locale: "en" | "fr" = "en",
) {
  try {
    const html = await render(
      WaitlistBetaCouponEmail({
        email,
        name: name || undefined,
        couponCode,
        inviteCode,
        position,
        locale,
      }),
    );
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "waitlistBetaCoupon"),
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send beta coupon email:", error);
    return { success: false, error };
  }
}

// ─── Onboarding emails ────────────────────────────────────────────────────────

import OnboardingCompleteEmail from "@/components/emails/onboarding-complete";

export async function sendOnboardingCompleteEmail(
  email: string,
  name: string | null,
  workspaceName: string,
  hasProvider: boolean,
  locale: "en" | "fr" = "en",
) {
  try {
    const html = await render(
      OnboardingCompleteEmail({
        email,
        name: name || undefined,
        workspaceName,
        hasProvider,
        locale,
      }),
    );
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "onboardingComplete", {
        workspace: workspaceName,
      }),
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send onboarding complete email:", err);
    return { success: false, error: err };
  }
}

// ─── Billing emails ───────────────────────────────────────────────────────────

import WaitlistBetaCouponEmail from "@/components/emails/waitlist-beta-coupon";
import BillingUpgradeEmail from "@/components/emails/billing-upgrade";
import BillingReceiptEmail from "@/components/emails/billing-receipt";
import BillingPaymentFailedEmail from "@/components/emails/billing-payment-failed";
import BillingRenewalReminderEmail from "@/components/emails/billing-renewal-reminder";
import BillingDowngradeEmail from "@/components/emails/billing-downgrade";
import BillingCancellationEmail from "@/components/emails/billing-cancellation";
import * as Sentry from "@sentry/nextjs";

export async function sendBillingUpgradeEmail(
  email: string,
  planName: string,
  locale: "en" | "fr" = "en",
) {
  try {
    const html = await render(BillingUpgradeEmail({ email, planName, locale }));
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "billingUpgrade", { plan: planName }),
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send billing upgrade email:", err);
    Sentry.captureException(err);
    return { success: false, error: err };
  }
}

export async function sendBillingReceiptEmail(
  email: string,
  amount: number,
  invoicePdfUrl: string | null | undefined,
  locale: "en" | "fr" = "en",
) {
  try {
    const html = await render(
      BillingReceiptEmail({ email, amount, invoicePdfUrl, locale }),
    );
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "billingReceipt"),
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send billing receipt email:", err);
    Sentry.captureException(err);
    return { success: false, error: err };
  }
}

export async function sendBillingPaymentFailedEmail(
  email: string,
  portalUrl: string,
  locale: "en" | "fr" = "en",
) {
  try {
    const html = await render(
      BillingPaymentFailedEmail({ email, portalUrl, locale }),
    );
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "billingPaymentFailed"),
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send payment failed email:", err);
    Sentry.captureException(err);
    return { success: false, error: err };
  }
}

export async function sendBillingRenewalReminderEmail(
  email: string,
  renewalDate: Date,
  amount: number,
  locale: "en" | "fr" = "en",
) {
  try {
    const html = await render(
      BillingRenewalReminderEmail({ email, renewalDate, amount, locale }),
    );
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "billingRenewalReminder"),
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send renewal reminder email:", err);
    Sentry.captureException(err);
    return { success: false, error: err };
  }
}

export async function sendBillingCancellationEmail(
  email: string,
  planName: string,
  accessUntil: Date,
  locale: "en" | "fr" = "en",
) {
  try {
    const html = await render(
      BillingCancellationEmail({ email, planName, accessUntil, locale }),
    );
    const dateStr = accessUntil.toLocaleDateString(
      locale === "fr" ? "fr-FR" : "en-US",
    );
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "billingCancellation", {
        plan: planName,
        date: dateStr,
      }),
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send billing cancellation email:", err);
    Sentry.captureException(err);
    return { success: false, error: err };
  }
}

export async function sendBillingDowngradeEmail(
  email: string,
  lostFeatures: string[],
  locale: "en" | "fr" = "en",
) {
  try {
    const html = await render(
      BillingDowngradeEmail({ email, lostFeatures, locale }),
    );
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "billingDowngrade"),
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send billing downgrade email:", err);
    Sentry.captureException(err);
    return { success: false, error: err };
  }
}

// ─── Admin user action emails ─────────────────────────────────────────────────

import UserSuspendedEmail from "@/components/emails/user-suspended";
import UserBannedEmail from "@/components/emails/user-banned";
import UserReactivatedEmail from "@/components/emails/user-reactivated";
import UserDeletedEmail from "@/components/emails/user-deleted";

export async function sendUserSuspendedEmail(
  email: string,
  name: string | null,
  locale: "en" | "fr" = "en",
) {
  try {
    const html = await render(
      UserSuspendedEmail({ email, name: name || undefined, locale }),
    );
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "userSuspended"),
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send user suspended email:", err);
    Sentry.captureException(err);
    return { success: false, error: err };
  }
}

export async function sendUserBannedEmail(
  email: string,
  name: string | null,
  reason: string | null,
  locale: "en" | "fr" = "en",
) {
  try {
    const html = await render(
      UserBannedEmail({
        email,
        name: name || undefined,
        reason: reason || undefined,
        locale,
      }),
    );
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "userBanned"),
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send user banned email:", err);
    Sentry.captureException(err);
    return { success: false, error: err };
  }
}

export async function sendUserReactivatedEmail(
  email: string,
  name: string | null,
  locale: "en" | "fr" = "en",
) {
  try {
    const html = await render(
      UserReactivatedEmail({ email, name: name || undefined, locale }),
    );
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "userReactivated"),
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send user reactivated email:", err);
    Sentry.captureException(err);
    return { success: false, error: err };
  }
}

export async function sendUserDeletedEmail(
  email: string,
  name: string | null,
  locale: "en" | "fr" = "en",
) {
  try {
    const html = await render(
      UserDeletedEmail({ email, name: name || undefined, locale }),
    );
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "GateCtr <noreply@gatectr.io>",
      to: email,
      subject: emailSubject(locale, "userDeleted"),
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send user deleted email:", err);
    Sentry.captureException(err);
    return { success: false, error: err };
  }
}
