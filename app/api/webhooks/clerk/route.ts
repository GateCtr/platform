import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendUserWelcomeEmail } from "@/lib/resend";
import { emailSubject } from "@/lib/email-subjects";
import {
  clerkUserPayloadMetadata,
  mergeUserMetadata,
  normalizeLocale,
  resolveLocaleForNewClerkUser,
} from "@/lib/user-locale";

/**
 * Clerk Webhook Handler
 *
 * Handles user lifecycle events from Clerk:
 * - user.created: Create user in database, assign DEVELOPER role, send welcome email
 * - user.updated: Update user information in database
 * - user.deleted: Soft delete user (set isActive to false)
 *
 * All webhooks are verified using Svix signature verification.
 * Implements idempotency using Clerk event IDs.
 */

// Store processed event IDs in memory (in production, use Redis or database)
const processedEvents = new Set<string>();

export async function POST(req: Request) {
  // Extract Svix headers for signature verification
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  // Verify required headers are present
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing Svix headers");
    return new Response("Missing Svix headers", { status: 400 });
  }

  // Get webhook secret from environment
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Get request body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Verify webhook signature using Svix
  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    // Log signature verification failure to audit log
    await logAudit({
      resource: "webhook",
      action: "webhook.signature_failed",
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
      ipAddress:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 401 });
  }

  // Check for idempotency - skip if event already processed
  const eventId = body.data?.id || svixId;
  if (processedEvents.has(eventId)) {
    console.log(`Event ${eventId} already processed, skipping`);
    return new Response("Event already processed", { status: 200 });
  }

  // Handle different event types
  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(evt, req);
        break;

      case "user.updated":
        await handleUserUpdated(evt);
        break;

      case "user.deleted":
        await handleUserDeleted(evt);
        break;

      case "session.created":
        await handleSessionCreated(evt);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // Mark event as processed
    processedEvents.add(eventId);

    // Clean up old event IDs (keep last 1000)
    if (processedEvents.size > 1000) {
      const entries = Array.from(processedEvents);
      entries
        .slice(0, entries.length - 1000)
        .forEach((id) => processedEvents.delete(id));
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error(`Error processing ${eventType}:`, error);

    // Log error to Sentry in production
    if (
      process.env.NODE_ENV === "production" &&
      typeof window === "undefined"
    ) {
      // Sentry will be configured globally
      console.error("Sentry logging:", error);
    }

    // Return 500 to trigger Clerk retry
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

/**
 * Handle user.created event
 * - Create User record in database
 * - Assign DEVELOPER role
 * - Send welcome email
 * - Log audit entry
 */
async function handleUserCreated(evt: WebhookEvent, req: Request) {
  if (evt.type !== "user.created") return;

  const {
    id,
    email_addresses,
    first_name,
    last_name,
    image_url,
    external_accounts,
  } = evt.data;

  const email = email_addresses[0]?.email_address;
  if (!email) {
    throw new Error("No email address found in user.created event");
  }

  const name = [first_name, last_name].filter(Boolean).join(" ") || null;

  // ── Waitlist gate ─────────────────────────────────────────────────────────
  // If waitlist mode is enabled, only users with status "INVITED" can sign up.
  // Anyone who bypasses the frontend (direct Clerk URL, API) gets deleted here.
  if (process.env.ENABLE_WAITLIST === "true") {
    const waitlistEntry = await prisma.waitlistEntry.findUnique({
      where: { email },
      select: { status: true },
    });
    if (!waitlistEntry || waitlistEntry.status !== "INVITED") {
      console.warn(`Waitlist gate: deleting unauthorized signup for ${email}`);
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerk = await clerkClient();
        await clerk.users.deleteUser(id);
      } catch (err) {
        console.error("Failed to delete unauthorized Clerk user:", err);
      }
      return;
    }
  }

  // Check if user already exists (idempotency at database level)
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: id },
  });

  if (existingUser) {
    console.log(`User ${id} already exists, skipping creation`);
    return;
  }

  const payload = evt.data as unknown as Record<string, unknown>;
  const { publicMetadata: clerkPublic, unsafeMetadata: clerkUnsafe } =
    clerkUserPayloadMetadata(payload);

  const waitlistForLocale = await prisma.waitlistEntry.findUnique({
    where: { email },
    select: { locale: true },
  });
  const locale = waitlistForLocale?.locale
    ? normalizeLocale(waitlistForLocale.locale)
    : resolveLocaleForNewClerkUser({
        publicMetadata: clerkPublic,
        unsafeMetadata: clerkUnsafe,
        acceptLanguageHeader: req.headers.get("accept-language"),
      });

  // Create user in database — no system role assigned, plan is the access control
  const authProvider = (external_accounts?.[0]?.provider ?? "email")
    .replace("oauth_", "")
    .toLowerCase();

  // Read referral source from unsafeMetadata (set by SignUpForm when ?ref=... is present)
  const refSource =
    typeof clerkUnsafe?.ref === "string" && clerkUnsafe.ref.trim()
      ? clerkUnsafe.ref.trim()
      : undefined;

  const user = await prisma.user.create({
    data: {
      clerkId: id,
      email,
      name,
      avatarUrl: image_url || null,
      plan: "FREE",
      isActive: true,
      authProvider,
      metadata: mergeUserMetadata(
        {},
        { locale, ...(refSource ? { ref: refSource } : {}) },
      ) as object,
    },
  });

  // Auto-redeem waitlist invite if the user was on the waitlist
  // We match by email — no need to validate the invite code client-side
  try {
    const waitlistEntry = await prisma.waitlistEntry.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    if (waitlistEntry && waitlistEntry.status === "INVITED") {
      await prisma.waitlistEntry.update({
        where: { id: waitlistEntry.id },
        data: { status: "JOINED", joinedAt: new Date() },
      });
      console.log(`Waitlist entry redeemed for ${email}`);
    }
  } catch (err) {
    // Non-fatal — user is already created, don't block
    console.error("Failed to redeem waitlist entry:", err);
  }

  // Set onboardingComplete + locale in Clerk publicMetadata (merge; do not wipe other keys).
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(id);
    const prevPm = (clerkUser.publicMetadata ?? {}) as Record<string, unknown>;
    await clerk.users.updateUser(id, {
      publicMetadata: {
        ...prevPm,
        onboardingComplete: false,
        locale,
      },
    });
  } catch (err) {
    // Non-fatal — onboarding gate will still work via DB fallback
    console.error("Failed to set Clerk publicMetadata after signup:", err);
  }

  // Log audit entry for user creation
  await logAudit({
    userId: user.id,
    resource: "user",
    action: "user.created",
    resourceId: user.id,
    newValue: { clerkId: id, email, name },
    success: true,
    ipAddress:
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  });

  // Send welcome email asynchronously (don't block webhook response)
  sendUserWelcomeEmail(email, name, locale)
    .then(async (result) => {
      // Log email attempt to EmailLog table
      await prisma.emailLog.create({
        data: {
          userId: user.id,
          resendId: result.resendId || null,
          to: email,
          subject: emailSubject(locale, "userWelcome"),
          template: "user-welcome",
          status: result.success ? "SENT" : "FAILED",
          error: result.success ? null : String(result.error),
        },
      });

      if (!result.success) {
        console.error("Failed to send welcome email:", result.error);
        // Log to Sentry but don't throw - email failure shouldn't break user creation
        if (process.env.NODE_ENV === "production") {
          console.error("Sentry logging: Welcome email failed", result.error);
        }
      }
    })
    .catch((error) => {
      console.error("Error logging email attempt:", error);
    });

  console.log(`User created: ${email} (${user.id})`);
}

/**
 * Handle user.updated event
 * - Update User record in database
 * - Log audit entry
 */
async function handleUserUpdated(evt: WebhookEvent) {
  if (evt.type !== "user.updated") return;

  const {
    id,
    email_addresses,
    first_name,
    last_name,
    image_url,
    external_accounts,
  } = evt.data;

  const email = email_addresses[0]?.email_address;
  if (!email) {
    throw new Error("No email address found in user.updated event");
  }

  const name = [first_name, last_name].filter(Boolean).join(" ") || null;

  // Find user by clerkId
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: id },
  });

  if (!existingUser) {
    console.warn(`User ${id} not found for update, skipping`);
    return;
  }

  const data = evt.data as unknown as Record<string, unknown>;
  const pm =
    (data.public_metadata as Record<string, unknown> | undefined) ??
    (data.publicMetadata as Record<string, unknown> | undefined);
  const metadataUpdate =
    pm != null && Object.prototype.hasOwnProperty.call(pm, "locale")
      ? mergeUserMetadata(existingUser.metadata, {
          locale: normalizeLocale(pm.locale),
        })
      : undefined;

  // Re-derive authProvider in case user linked a new OAuth account
  const authProvider =
    external_accounts && external_accounts.length > 0
      ? ((external_accounts[0] as { provider?: string }).provider
          ?.replace("oauth_", "")
          .toLowerCase() ?? "email")
      : (existingUser.authProvider ?? "email");

  // Update user in database
  const updatedUser = await prisma.user.update({
    where: { clerkId: id },
    data: {
      email,
      name,
      avatarUrl: image_url || null,
      authProvider,
      ...(metadataUpdate ? { metadata: metadataUpdate as object } : {}),
    },
  });

  // Log audit entry for user update
  await logAudit({
    userId: updatedUser.id,
    resource: "user",
    action: "user.updated",
    resourceId: updatedUser.id,
    oldValue: {
      email: existingUser.email,
      name: existingUser.name,
      avatarUrl: existingUser.avatarUrl,
    },
    newValue: {
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl,
    },
    success: true,
  });

  console.log(`User updated: ${email} (${updatedUser.id})`);
}

/**
 * Handle user.deleted event
 * - Soft delete user (set isActive to false)
 * - Log audit entry
 */
async function handleUserDeleted(evt: WebhookEvent) {
  if (evt.type !== "user.deleted") return;

  const { id } = evt.data;

  // Find user by clerkId
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: id },
  });

  if (!existingUser) {
    console.warn(`User ${id} not found for deletion, skipping`);
    return;
  }

  // Soft delete user (set isActive to false)
  const deletedUser = await prisma.user.update({
    where: { clerkId: id },
    data: {
      isActive: false,
    },
  });

  // Log audit entry for user deletion
  await logAudit({
    userId: deletedUser.id,
    resource: "user",
    action: "user.deleted",
    resourceId: deletedUser.id,
    oldValue: { isActive: true },
    newValue: { isActive: false },
    success: true,
  });

  console.log(`User soft deleted: ${deletedUser.email} (${deletedUser.id})`);
}

/**
 * Handle session.created event
 * - Update lastLoginAt on the user
 * - Sync authProvider from Clerk in case user switched OAuth method
 */
async function handleSessionCreated(evt: WebhookEvent) {
  if (evt.type !== "session.created") return;
  const clerkId = evt.data.user_id;
  if (!clerkId) return;

  // Fetch latest external_accounts from Clerk to get current auth provider
  let authProvider: string | undefined;
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(clerkId);
    const ext = clerkUser.externalAccounts?.[0];
    if (ext) {
      authProvider = ext.provider?.replace("oauth_", "").toLowerCase();
    }
  } catch {
    // Non-fatal — lastLoginAt will still be updated
  }

  await prisma.user.updateMany({
    where: { clerkId },
    data: {
      lastLoginAt: new Date(),
      ...(authProvider ? { authProvider } : {}),
    },
  });
}
