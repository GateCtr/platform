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

async function main() {
  const clerkId = "user_3BWUuVSfAWjVH8ampS8KdGntjwZ";
  const email = "sabowaryan@gatectr.com";
  const name = "Ryan Sabowa";

  // 1. Upsert user
  const user = await prisma.user.upsert({
    where: { clerkId },
    update: { isActive: true },
    create: { clerkId, email, name, isActive: true },
  });
  console.log("✅ User upserted:", user.id);

  // 2. Assign SUPER_ADMIN role
  const role = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  if (!role) throw new Error("SUPER_ADMIN role not found — run seed first");

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
  console.log("✅ SUPER_ADMIN role assigned");

  // 3. Create default team
  const team = await prisma.team.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      name: "Personal",
      slug: "personal",
      ownerId: user.id,
    },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: user.id } },
    update: {},
    create: { teamId: team.id, userId: user.id, role: "OWNER" },
  });
  console.log("✅ Team created:", team.id);

  // 4. Store activeTeamId in user metadata
  await prisma.user.update({
    where: { id: user.id },
    data: { metadata: { activeTeamId: team.id, onboardingComplete: true } },
  });
  console.log("✅ Metadata updated");

  // 5. Create FREE subscription
  const freePlan = await prisma.plan.findUnique({ where: { name: "FREE" } });
  if (freePlan) {
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        planId: freePlan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log("✅ FREE subscription created");
  }

  console.log("\n🎉 Dev user ready!");
  console.log(`   clerkId: ${clerkId}`);
  console.log(`   userId:  ${user.id}`);
  console.log(`   teamId:  ${team.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
