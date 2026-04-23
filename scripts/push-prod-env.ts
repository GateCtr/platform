/**
 * push-prod-env.ts
 *
 * Push production env vars to Amplify branch `main`.
 * Reads from .env.production.local (NOT committed to git).
 *
 * Usage:
 *   1. Copy .env.example to .env.production.local
 *   2. Fill in all production values (live Stripe, Clerk, Resend keys)
 *   3. Run: pnpm tsx scripts/push-prod-env.ts
 */

import { readFileSync, existsSync, writeFileSync, unlinkSync } from "fs";
import { execSync } from "child_process";

const ENV_FILE = ".env.production.local";
const APP_ID = "d3ntbka0r4vvb1";
const BRANCH = "main";
const REGION = "eu-north-1";

if (!existsSync(ENV_FILE)) {
  console.error(`\n❌ ${ENV_FILE} not found.`);
  console.error(`\nCreate it from .env.example and fill in production values:`);
  console.error(`  cp .env.example ${ENV_FILE}`);
  console.error(`  # Edit ${ENV_FILE} with live keys\n`);
  process.exit(1);
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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Strip inline comments
    const commentIdx = value.indexOf("   #");
    if (commentIdx !== -1) value = value.slice(0, commentIdx).trim();
    if (key && value) vars[key] = value;
  }
  return vars;
}

const vars = parseEnvFile(ENV_FILE);

// Production URL overrides
vars["NEXT_PUBLIC_APP_URL"] = "https://app.gatectr.com";
vars["NEXT_PUBLIC_MARKETING_URL"] = "https://www.gatectr.com";
vars["NEXT_PUBLIC_STATUS_URL"] = "https://status.gatectr.com";

// Remove vars that shouldn't be in production
delete vars["CSRF_EXTRA_ORIGINS"];
delete vars["VERCEL_OIDC_TOKEN"];

console.log(`\n📦 Pushing ${Object.keys(vars).length} vars to Amplify`);
console.log(`   App ID : ${APP_ID}`);
console.log(`   Branch : ${BRANCH}`);
console.log(`   Region : ${REGION}\n`);

// Build JSON for AWS CLI
const inputObj = {
  appId: APP_ID,
  branchName: BRANCH,
  environmentVariables: vars,
};

import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

const tmpFile = join(
  tmpdir(),
  `amplify-prod-env-${randomBytes(16).toString("hex")}.json`,
);
writeFileSync(tmpFile, JSON.stringify(inputObj), "utf-8");

try {
  execSync(
    `aws amplify update-branch --cli-input-json "file://${tmpFile}" --region ${REGION}`,
    { stdio: "inherit" },
  );
  console.log(`\n✅ Production env vars pushed to branch ${BRANCH}`);
} catch (e) {
  console.error(`\n❌ Failed to push env vars`, e);
} finally {
  try {
    unlinkSync(tmpFile);
  } catch {}
}

console.log(`\n⚠️  Don't forget to:`);
console.log(`   1. Update webhook URLs in Clerk, Stripe, Resend dashboards`);
console.log(`   2. Merge develop → main when ready`);
console.log(`   3. Delete ${ENV_FILE} after pushing\n`);
