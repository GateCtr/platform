// Lazy queue initialization — connections are created on first use, not at module load.
// This prevents bullmq/ioredis from being instantiated during Next.js Lambda cold start,
// which caused "Cannot find module 'tslib'" errors in the Amplify SSR runtime.

import type { Queue } from "bullmq";
import type IORedis from "ioredis";

export interface WebhookJobData {
  webhookId?: string; // undefined = fan-out to all user webhooks
  userId: string;
  event: string;
  payload: Record<string, unknown>;
  deliveryId?: string;
}

export interface AnalyticsJobData {
  userId: string;
  projectId?: string;
  apiKeyId?: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  savedTokens: number;
  costUsd: number;
  latencyMs: number;
  statusCode: number;
  optimized: boolean;
  routed: boolean;
  fallback: boolean;
  ipAddress?: string;
}

export interface DailyReportJobData {
  date: string; // "YYYY-MM-DD" — the day to aggregate (yesterday)
}

export interface EmailJobData {
  type: "team_invitation";
  to: string;
  inviteeName?: string;
  inviterName: string;
  teamName: string;
  role: string;
  acceptUrl: string;
  expiryDays?: number;
  locale?: "en" | "fr";
}

export interface HealthJobData {
  triggeredAt: string; // ISO timestamp
}

export interface OutreachFollowupJobData {
  type: "outreach_followup" | "outreach_auto_refuse";
  prospectId: string;
  step: number;
}

// BullMQ shared options
export const bullmqDefaults = { skipVersionCheck: true } as const;

// Lazy singletons — only instantiated on first access
let _redisConnection: InstanceType<typeof IORedis> | null = null;
let _webhooksQueue: Queue<WebhookJobData> | null = null;
let _analyticsQueue: Queue<AnalyticsJobData> | null = null;
let _dailyReportQueue: Queue<DailyReportJobData> | null = null;
let _emailQueue: Queue<EmailJobData> | null = null;
let _healthQueue: Queue<HealthJobData> | null = null;
let _outreachQueue: Queue<OutreachFollowupJobData> | null = null;

async function getRedisConnection(): Promise<InstanceType<typeof IORedis>> {
  if (!_redisConnection) {
    const { default: IORedis } = await import("ioredis");
    _redisConnection = new IORedis(
      process.env.REDIS_EXTERNAL_URL ?? process.env.REDIS_URL!,
      {
        maxRetriesPerRequest: null,
        retryStrategy: (times) => {
          if (times >= 10) return null;
          return Math.min(times * 1000, 30000);
        },
      },
    );
  }
  return _redisConnection;
}

async function getQueue<T>(
  name: string,
  cache: Queue<T> | null,
  setter: (q: Queue<T>) => void,
  options?: object,
): Promise<Queue<T>> {
  if (!cache) {
    const { Queue } = await import("bullmq");
    const connection = await getRedisConnection();
    const q = new Queue<T>(name, {
      connection,
      ...bullmqDefaults,
      ...options,
    });
    setter(q);
    return q;
  }
  return cache;
}

export async function getWebhooksQueue(): Promise<Queue<WebhookJobData>> {
  return getQueue(
    "webhooks",
    _webhooksQueue,
    (q) => {
      _webhooksQueue = q;
    },
    {
      defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    },
  );
}

export async function getAnalyticsQueue(): Promise<Queue<AnalyticsJobData>> {
  return getQueue(
    "analytics",
    _analyticsQueue,
    (q) => {
      _analyticsQueue = q;
    },
    {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "fixed", delay: 2000 },
        removeOnComplete: { count: 5000 },
        removeOnFail: { count: 10000 },
      },
    },
  );
}

export async function getDailyReportQueue(): Promise<
  Queue<DailyReportJobData>
> {
  return getQueue(
    "daily-report",
    _dailyReportQueue,
    (q) => {
      _dailyReportQueue = q;
    },
    {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "fixed", delay: 5000 },
        removeOnComplete: { count: 90 },
        removeOnFail: { count: 30 },
      },
    },
  );
}

export async function getEmailQueue(): Promise<Queue<EmailJobData>> {
  return getQueue(
    "emails",
    _emailQueue,
    (q) => {
      _emailQueue = q;
    },
    {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: { count: 2000 },
        removeOnFail: { count: 5000 },
      },
    },
  );
}

export async function getHealthQueue(): Promise<Queue<HealthJobData>> {
  return getQueue(
    "health",
    _healthQueue,
    (q) => {
      _healthQueue = q;
    },
    {
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "fixed", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      },
    },
  );
}

export async function getOutreachQueue(): Promise<
  Queue<OutreachFollowupJobData>
> {
  return getQueue(
    "outreach-followups",
    _outreachQueue,
    (q) => {
      _outreachQueue = q;
    },
    {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 2000 },
      },
    },
  );
}

// Legacy sync exports for workers (they run in Node.js, not Lambda)
// Workers import these directly — they don't go through Next.js
export { getRedisConnection as getRedisConnectionSync };
