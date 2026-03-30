import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (takes precedence), then .env as fallback
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
    // Shadow DB required by `prisma migrate dev` — use a dedicated Neon branch in production
    // Create one at: https://console.neon.tech → your project → Branches → New branch
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
