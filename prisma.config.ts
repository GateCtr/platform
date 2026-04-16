// Load .env first — dotenv never overwrites already-set env vars (e.g. from CI)
import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Also attempt .env.local for local dev (won't override CI-injected vars)
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Use process.env directly (not env() helper) so missing DATABASE_URL
    // doesn't throw on commands that don't need a DB connection (e.g. prisma generate)
    url: process.env.DATABASE_URL ?? "",
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
