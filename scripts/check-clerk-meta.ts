import { config } from "dotenv";
config({ path: ".env.local" });

import { createClerkClient } from "@clerk/backend";

async function main() {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const email = process.argv[2] ?? "sabowaryan@gmail.com";
  const res = await clerk.users.getUserList({ emailAddress: [email] });
  const u = res.data[0];
  if (!u) { console.error("User not found"); process.exit(1); }
  console.log("clerkId      :", u.id);
  console.log("publicMetadata:", JSON.stringify(u.publicMetadata, null, 2));
}

main().catch(console.error);
