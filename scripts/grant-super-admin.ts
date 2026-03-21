/**
 * Grant SUPER_ADMIN role to an existing user
 * Usage: pnpm tsx scripts/grant-super-admin.ts <email>
 *
 * Example:
 *   pnpm tsx scripts/grant-super-admin.ts user@example.com
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
    console.error("Usage: pnpm tsx scripts/grant-super-admin.ts <email>");
    process.exit(1);
  }

  console.log(`\nGranting SUPER_ADMIN to: ${email}\n`);

  // 1. Find user in DB
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found in DB: ${email}`);
    process.exit(1);
  }
  console.log(`  Found user: ${user.id} (clerkId: ${user.clerkId})`);

  // 2. Find or create SUPER_ADMIN role
  const role = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: {
      name: "SUPER_ADMIN",
      displayName: "Super Admin",
      description: "Full platform access",
      isSystem: true,
    },
  });
  console.log(`  Role: ${role.id} (${role.name})`);

  // 3. Create UserRole (idempotent)
  const userRole = await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
      grantedBy: "script",
    },
  });
  console.log(`  UserRole: ${userRole.id} (${userRole.userId} → ${role.name})`);

  // 4. Update Clerk publicMetadata — merge to preserve existing keys (e.g. onboardingComplete)
  const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  const clerkUser = await clerk.users.getUser(user.clerkId);
  const existingMeta =
    (clerkUser.publicMetadata as Record<string, unknown>) ?? {};
  await clerk.users.updateUser(user.clerkId, {
    publicMetadata: { ...existingMeta, role: "SUPER_ADMIN" },
  });
  console.log(`  Clerk publicMetadata updated`);

  // 5. Invalidate Redis permission cache
  const { redis } = await import("../lib/redis");
  await redis.del(`permissions:${user.id}`);
  console.log(`  Redis cache invalidated`);

  console.log(`\nDone. ${email} is now SUPER_ADMIN.\n`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
