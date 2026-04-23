/**
 * Worker-specific queue exports.
 * This file is ONLY imported by workers/ — never by Next.js app routes.
 * Workers run in Node.js long-running processes where sync module-level
 * instantiation is safe and expected.
 */

import { Queue } from "bullmq";
import IORedis from "ioredis";
import { bullmqDefaults } from "./queues";
import type {
  WebhookJobData,
  AnalyticsJobData,
  DailyReportJobData,
  EmailJobData,
  HealthJobData,
  OutreachFollowupJobData,
} from "./queues";

export type {
  WebhookJobData,
  AnalyticsJobData,
  DailyReportJobData,
  EmailJobData,
  HealthJobData,
  OutreachFollowupJobData,
};

export const redisConnection = new IORedis(
  process.env.REDIS_EXTERNAL_URL ?? process.env.REDIS_URL!,
  {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      if (times >= 10) return null;
      return Math.min(times * 1000, 30000);
    },
  },
);

export const webhooksQueue = new Queue<WebhookJobData>("webhooks", {
  connection: redisConnection,
  ...bullmqDefaults,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export const analyticsQueue = new Queue<AnalyticsJobData>("analytics", {
  connection: redisConnection,
  ...bullmqDefaults,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "fixed", delay: 2000 },
    removeOnComplete: { count: 5000 },
    removeOnFail: { count: 10000 },
  },
});

export const dailyReportQueue = new Queue<DailyReportJobData>("daily-report", {
  connection: redisConnection,
  ...bullmqDefaults,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "fixed", delay: 5000 },
    removeOnComplete: { count: 90 },
    removeOnFail: { count: 30 },
  },
});

export const emailQueue = new Queue<EmailJobData>("emails", {
  connection: redisConnection,
  ...bullmqDefaults,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { count: 2000 },
    removeOnFail: { count: 5000 },
  },
});

export const healthQueue = new Queue<HealthJobData>("health", {
  connection: redisConnection,
  ...bullmqDefaults,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  },
});

export const outreachQueue = new Queue<OutreachFollowupJobData>(
  "outreach-followups",
  {
    connection: redisConnection,
    ...bullmqDefaults,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 2000 },
    },
  },
);
