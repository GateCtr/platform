import "server-only";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import type { AnnouncementConfig } from "@/lib/announcement-types";

export type {
  AnnouncementConfig,
  AnnouncementVariant,
} from "@/lib/announcement-types";

const CACHE_KEY = "announcement_bar";
const CACHE_TTL = 300; // 5 minutes

export async function getAnnouncement(): Promise<AnnouncementConfig | null> {
  try {
    // Try Redis cache first
    const cached = await redis.get<AnnouncementConfig>(CACHE_KEY);
    if (cached) return cached;
  } catch {
    // Redis unavailable — fall through to DB
  }

  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key: "announcement_bar" },
      select: { enabled: true, description: true },
    });

    if (!flag?.enabled || !flag.description) return null;

    const config = JSON.parse(flag.description) as AnnouncementConfig;

    // Cache the result
    try {
      await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(config));
    } catch {
      // Cache write failure is non-fatal
    }

    return config;
  } catch {
    return null;
  }
}

export async function invalidateAnnouncementCache(): Promise<void> {
  try {
    await redis.del(CACHE_KEY);
  } catch {
    // Non-fatal
  }
}
