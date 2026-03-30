import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { Client } from "pg";

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  const res = await client.query(
    "SELECT key, enabled, description FROM feature_flags WHERE key = 'announcement_bar'",
  );
  console.log("Row count:", res.rowCount);
  if (res.rowCount === 0) {
    console.log(
      "❌ No announcement_bar flag found in DB — create one via admin panel",
    );
  } else {
    console.log(JSON.stringify(res.rows[0], null, 2));
    if (!res.rows[0].enabled) {
      console.log("❌ Flag exists but enabled = false");
    } else {
      console.log("✓ Flag is enabled");
      try {
        JSON.parse(res.rows[0].description);
        console.log("✓ Description is valid JSON");
      } catch {
        console.log(
          "❌ Description is NOT valid JSON:",
          res.rows[0].description,
        );
      }
    }
  }
  await client.end();
}

main().catch(console.error);
