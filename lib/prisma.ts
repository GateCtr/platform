import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create PostgreSQL connection pool
// On serverless (Vercel), each function instance creates its own pool.
// Limit to 1 connection per pool to avoid exhausting Neon's connection limit.
// Use Neon's pooled endpoint (pgbouncer) in production for best results.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === "production" ? 1 : 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});

// Create Prisma adapter
// @ts-expect-error - Type mismatch between @types/pg versions used by adapter and installed version
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
