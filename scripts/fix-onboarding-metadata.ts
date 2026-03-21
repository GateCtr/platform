/**
 * Fix onboardingComplete in Clerk publicMetadata for a user whose DB record
 * shows onboarding is done but the Clerk JWT doesn't reflect it.
 *
 * Usage: pnpm tsx scripts/fix-onboarding-metadata.ts <email>
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createClerkClient } from "@clerk/nextjs/server";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// @ts-expect-error - Type mismatch between @types/pg versions
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: pnpm tsx scripts/fix-onboarding-metadata.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const meta = user.metadata as Record<string, unknown> | null;
  const dbOnboardingDone = meta?.onboardingComplete === true;
  console.log(`DB onboardingComplete: ${dbOnboardingDone}`);

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const clerkUser = await clerk.users.getUser(user.clerkId);
  const existingMeta =
    (clerkUser.publicMetadata as Record<string, unknown>) ?? {};

  console.log(`Clerk publicMetadata (before):`, existingMeta);

  await clerk.users.updateUser(user.clerkId, {
    publicMetadata: { ...existingMeta, onboardingComplete: dbOnboardingDone },
  });

  console.log(`Clerk publicMetadata (after):`, {
    ...existingMeta,
    onboardingComplete: dbOnboardingDone,
  });
  console.log(`\nDone. Sign out and sign back in to get a fresh JWT.\n`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
