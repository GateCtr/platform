import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const toDelete = [
    "20260322134537_business_modules_core",
    "20260322210121_team_schema_completion",
    "20260322215315_add_team_id_to_resources",
    "20260330000003_reconcile_drift",
  ];

  for (const name of toDelete) {
    const res = await client.query(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = $1 RETURNING migration_name`,
      [name],
    );
    if (res.rowCount) {
      console.log(`✓ Deleted: ${name}`);
    } else {
      console.log(`- Not found: ${name}`);
    }
  }

  const remaining = await client.query(
    `SELECT migration_name FROM "_prisma_migrations" ORDER BY started_at`,
  );
  console.log("\nRemaining migrations in DB:");
  remaining.rows.forEach((r: { migration_name: string }) =>
    console.log(" -", r.migration_name),
  );

  await client.end();
}

main().catch(console.error);
