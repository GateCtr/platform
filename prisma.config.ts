import { defineConfig } from "prisma/config";

// Do NOT load any .env files here.
// - In CI: DATABASE_URL is injected directly via the workflow env: block.
// - In local dev: Next.js / tsx load .env.local before this runs.
// Loading .env.local here would overwrite the CI-injected DATABASE_URL with an empty value
// if the file exists but contains no DATABASE_URL (e.g. a blank .env.local on the runner).

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // process.env.DATABASE_URL is set by:
    //   - CI: env: block in the workflow step
    //   - local dev: run `source .env.local` or use `dotenv -e .env.local pnpm prisma ...`
    url: process.env.DATABASE_URL ?? "",
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
