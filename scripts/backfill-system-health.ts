/**
 * Backfill SystemHealth records for the past 90 days.
 * Inserts one HEALTHY record per service per day for days with no data.
 * Safe to run multiple times (skips days that already have data).
 */
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

const SERVICES = ["app", "database", "redis", "queue", "stripe"] as const;
const DAYS = 90;

async function main() {
  console.log(`🔄 Backfilling ${DAYS} days of SystemHealth data...`);

  // Find existing records to avoid duplicates
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const existing = await prisma.systemHealth.findMany({
    where: { checkedAt: { gte: since } },
    select: { service: true, checkedAt: true },
  });

  // Build set of existing day+service combos
  const existingSet = new Set(
    existing.map(
      (r) => `${r.service}::${r.checkedAt.toISOString().slice(0, 10)}`,
    ),
  );

  let inserted = 0;
  let skipped = 0;

  for (let i = DAYS - 1; i >= 1; i--) {
    // Skip today (i=0) — let the worker handle it
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const day = d.toISOString().slice(0, 10);
    // Set time to noon UTC for the backfill record
    const checkedAt = new Date(`${day}T12:00:00.000Z`);

    for (const svc of SERVICES) {
      const key = `${svc}::${day}`;
      if (existingSet.has(key)) {
        skipped++;
        continue;
      }

      await prisma.systemHealth.create({
        data: {
          service: svc,
          status: "HEALTHY",
          checkedAt,
        },
      });
      inserted++;
    }
  }

  console.log(`✅ Done: ${inserted} records inserted, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error("❌ Backfill failed:", e);
    process.exit(1);
  })
  .finally(() => pool.end());
