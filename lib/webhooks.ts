import { webhooksQueue } from "@/lib/queues";

/**
 * Enqueue a webhook delivery job into BullMQ.
 * Fire-and-forget — returns immediately, never throws.
 */
export async function dispatchWebhook(
  userId: string,
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    await webhooksQueue.add("deliver", { userId, event, payload: data });
  } catch (err) {
    console.warn("[webhooks] failed to enqueue job:", err);
  }
}
