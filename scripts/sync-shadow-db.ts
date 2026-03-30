/**
 * Registers all local migrations in the shadow DB's _prisma_migrations table
 * WITHOUT re-executing the SQL (schema already exists on shadow).
 */
import { Client } from "pg";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const shadowUrl = process.env.SHADOW_DATABASE_URL;
if (!shadowUrl) {
  console.error("SHADOW_DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: shadowUrl });
  await client.connect();
  console.log("Connected to shadow DB\n");

  // Create _prisma_migrations if missing
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      id TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      finished_at TIMESTAMPTZ,
      migration_name TEXT NOT NULL UNIQUE,
      logs TEXT,
      rolled_back_at TIMESTAMPTZ,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      applied_steps_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const folders = fs
    .readdirSync(migrationsDir)
    .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort();

  for (const folder of folders) {
    const sqlFile = path.join(migrationsDir, folder, "migration.sql");
    const sql = fs.existsSync(sqlFile) ? fs.readFileSync(sqlFile, "utf-8") : "";
    const checksum = crypto.createHash("sha256").update(sql).digest("hex");

    await client.query(
      `INSERT INTO "_prisma_migrations"
         (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       VALUES (gen_random_uuid()::text, $1, NOW(), $2, NULL, NULL, NOW(), 1)
       ON CONFLICT (migration_name) DO UPDATE SET checksum = $1, finished_at = NOW()`,
      [checksum, folder],
    );
    console.log(`  ✓ Registered: ${folder}`);
  }

  await client.end();
  console.log("\nAll migrations registered on shadow DB.");
}

main().catch(console.error);
