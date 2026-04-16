/**
 * setup-amplify-ssm.ts
 *
 * Pushes all variables from .env.local to AWS SSM Parameter Store
 * under the path /amplify/<APP_ID>/<BRANCH>/
 *
 * Usage:
 *   tsx scripts/setup-amplify-ssm.ts --app-id d3ntbka0r4vvb1 --branch develop
 *   tsx scripts/setup-amplify-ssm.ts --app-id d3ntbka0r4vvb1 --branch main
 *
 * Prerequisites:
 *   - AWS CLI configured (aws configure) or AWS_* env vars set
 *   - pnpm add -D @aws-sdk/client-ssm (or use aws CLI fallback below)
 *
 * Skip list: variables that should NOT be pushed to SSM
 * (either not needed at build time, or Amplify injects them automatically)
 */

import { readFileSync } from "fs";
import { execSync } from "child_process";

const SKIP = new Set([
  "NEXT_PUBLIC_APP_URL", // set per-branch in Amplify Console
  "VERCEL_OIDC_TOKEN",
  "CSRF_EXTRA_ORIGINS",
]);

// Variables that are safe to store as String (not SecureString)
// Everything else goes as SecureString
const PLAIN_STRING = new Set([
  "NEXT_PUBLIC_MARKETING_URL",
  "NEXT_PUBLIC_STATUS_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "ENABLE_GEO_BLOCKING",
  "ENABLE_SIGNUPS",
  "ENABLE_WAITLIST",
  "LAUNCH_DATE",
  "PH_COUPON_ID",
  "EMAIL_ASSET_BASE_URL",
  "INBOX_FROM_EMAIL",
  "INBOX_FROM_NAME",
  "RESEND_FROM_EMAIL",
  "OUTREACH_SENDER_NAME",
]);

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
  };
  const appId = get("--app-id");
  const branch = get("--branch") ?? "develop";
  const region = get("--region") ?? process.env.AWS_REGION ?? "us-east-1";
  const dryRun = args.includes("--dry-run");
  if (!appId) {
    console.error(
      "Usage: tsx scripts/setup-amplify-ssm.ts --app-id <APP_ID> [--branch <BRANCH>] [--region <REGION>] [--dry-run]",
    );
    process.exit(1);
  }
  return { appId, branch, region, dryRun };
}

function parseEnvFile(path: string): Record<string, string> {
  const content = readFileSync(path, "utf-8");
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && value) vars[key] = value;
  }
  return vars;
}

function putParameter(
  name: string,
  value: string,
  type: "String" | "SecureString",
  region: string,
  dryRun: boolean,
) {
  if (dryRun) {
    console.log(
      `[DRY RUN] PUT ${type} ${name} = ${type === "SecureString" ? "***" : value}`,
    );
    return;
  }
  try {
    const escaped = value.replace(/'/g, "'\\''");
    execSync(
      `aws ssm put-parameter --name "${name}" --value '${escaped}' --type ${type} --overwrite --region ${region}`,
      { stdio: "pipe" },
    );
    console.log(`✅ ${type.padEnd(12)} ${name}`);
  } catch (e) {
    console.error(`❌ Failed: ${name}`, (e as Error).message);
  }
}

async function main() {
  const { appId, branch, region, dryRun } = parseArgs();
  const basePath = `/amplify/${appId}/${branch}`;

  console.log(`\n📦 Pushing env vars to SSM`);
  console.log(`   App ID : ${appId}`);
  console.log(`   Branch : ${branch}`);
  console.log(`   Path   : ${basePath}/`);
  console.log(`   Region : ${region}`);
  console.log(`   Mode   : ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  const vars = parseEnvFile(".env.local");
  let pushed = 0;
  let skipped = 0;

  for (const [key, value] of Object.entries(vars)) {
    if (SKIP.has(key)) {
      console.log(`⏭️  Skipped  ${key}`);
      skipped++;
      continue;
    }
    if (!value) {
      console.log(`⚠️  Empty    ${key} — skipping`);
      skipped++;
      continue;
    }
    const type = PLAIN_STRING.has(key) ? "String" : "SecureString";
    putParameter(`${basePath}/${key}`, value, type, region, dryRun);
    pushed++;
  }

  console.log(`\nDone — ${pushed} pushed, ${skipped} skipped.`);
  if (dryRun) console.log("Run without --dry-run to apply.");
}

main();
