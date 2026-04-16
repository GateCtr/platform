import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// @ts-expect-error - Type mismatch between @types/pg versions
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Count current PH signups
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { metadata: true },
  });

  const phCount = users.filter((u) => {
    const meta = (u.metadata ?? {}) as Record<string, unknown>;
    return meta.ref === "producthunt";
  }).length;

  console.log(`📊 Current PH signups: ${phCount}`);
  console.log(`📊 Total users: ${users.length}`);

  // Force a milestone notification by temporarily clearing Redis key
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const key = `launch:milestone:producthunt`;
  const current = await redis.get<number>(key);
  console.log(`🔑 Current Redis milestone: ${current ?? "none"}`);

  // Reset to 0 to force next milestone notification
  await redis.del(key);
  console.log("🔄 Redis milestone reset to 0");

  // Now trigger the check
  const { checkAndNotifyMilestone } = await import("@/lib/actions/launch");
  await checkAndNotifyMilestone("producthunt");
  console.log("✅ Milestone check triggered — check Slack!");
}

main()
  .catch(console.error)
  .finally(() => pool.end());
