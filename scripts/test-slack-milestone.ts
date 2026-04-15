import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

async function testSlack() {
  const slackUrl = process.env.SLACK_LAUNCH_WEBHOOK_URL;
  if (!slackUrl) {
    console.error("❌ SLACK_LAUNCH_WEBHOOK_URL not set in .env.local");
    process.exit(1);
  }

  console.log("🔔 Sending test Slack notification...");

  const res = await fetch(slackUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "🚀 *GateCtr — Test notification*\nMilestone: *10* signups from producthunt\nTotal users: 42",
    }),
  });

  if (res.ok) {
    console.log("✅ Slack notification sent successfully!");
  } else {
    const body = await res.text();
    console.error(`❌ Slack error ${res.status}: ${body}`);
  }
}

testSlack().catch(console.error);
