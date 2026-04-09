import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { outreachTemplates } from "./seed-outreach-templates";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Category inference from tags ────────────────────────────────────────────

function inferCategory(tags: string[]): string {
  const t = tags.join(" ");
  if (/agent|memory|autonomous/.test(t)) return "agents";
  if (/code-search|code-gen|ai-ide|ai-coding|open-source|vscode/.test(t))
    return "code-gen";
  if (/voice-ai|audio|transcription|conversational/.test(t)) return "voice-ai";
  if (/legal-ai|rag|document|search/.test(t)) return "rag";
  if (/data-analytics|data-enrichment|audit-ai|batch/.test(t))
    return "data-analytics";
  if (
    /saas|crm|hr-tech|no-code/.test(t) &&
    !/agent|memory|autonomous|rag|document|code-gen|ai-ide|voice-ai|audio/.test(
      t,
    )
  )
    return "saas-ai";
  return "general";
}
// @ts-expect-error - Type mismatch between @types/pg versions
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── TIER_1 — Founders / CTOs / C-suite at AI-native companies ───────────────
const tier1Prospects = [
  {
    email: "scottwu@cognition.ai",
    firstName: "Scott",
    lastName: "Wu",
    company: "Cognition AI",
    jobTitle: null,
    website: "https://cognition.ai",
    linkedinUrl: null,
    tier: "TIER_1",
    status: "NEW",
    tags: ["founder", "ai-coding", "agent"],
  },
  {
    email: "daksh@greptile.com",
    firstName: "Daksh",
    lastName: "Gupta",
    company: "Greptile",
    jobTitle: null,
    website: "https://greptile.com",
    linkedinUrl: null,
    tier: "TIER_1",
    status: "NEW",
    tags: ["founder", "code-search", "llm"],
  },
  {
    email: "daniel@getzep.com",
    firstName: "Daniel",
    lastName: "Chalef",
    company: "Zep",
    jobTitle: null,
    website: "https://getzep.com",
    linkedinUrl: null,
    tier: "TIER_1",
    status: "NEW",
    tags: ["founder", "memory", "agents"],
  },
  {
    email: "martin@nabla.com",
    firstName: "Martin",
    lastName: "Raison",
    company: "Nabla",
    jobTitle: "CTO",
    website: "https://nabla.com",
    linkedinUrl: "https://www.linkedin.com/in/martinraison",
    tier: "TIER_1",
    status: "NEW",
    tags: ["cto", "health-ai", "llm"],
  },
  {
    email: "mateo.rojas-carulla@lakera.ai",
    firstName: "Mateo",
    lastName: "Rojas-Carulla",
    company: "Lakera",
    jobTitle: null,
    website: "https://lakera.ai",
    linkedinUrl: null,
    tier: "TIER_1",
    status: "NEW",
    tags: ["founder", "ai-security", "llm"],
  },
  {
    email: "vijay@turing.com",
    firstName: "Vijay",
    lastName: "Krishnan",
    company: "Turing",
    jobTitle: "Founder",
    website: "https://turing.com",
    linkedinUrl: null,
    tier: "TIER_1",
    status: "NEW",
    tags: ["founder", "ai-talent", "engineering"],
  },
  {
    email: "jonas@cursor.com",
    firstName: "Jonas",
    lastName: "Nelle",
    company: "Cursor",
    jobTitle: null,
    website: "https://cursor.com",
    linkedinUrl: null,
    tier: "TIER_1",
    status: "NEW",
    tags: ["founder", "ai-ide", "coding"],
  },
  {
    email: "deshraj@mem0.ai",
    firstName: "Deshraj",
    lastName: "Yadav",
    company: "Mem0",
    jobTitle: "Co-founder and CTO",
    website: "https://mem0.ai",
    linkedinUrl: "https://www.linkedin.com/in/deshrajdry",
    tier: "TIER_1",
    status: "NEW",
    tags: ["cto", "memory", "agents"],
  },
  {
    email: "flo@lindy.ai",
    firstName: "Flo",
    lastName: "Crivello",
    company: "Lindy AI",
    jobTitle: "CEO",
    website: "https://lindy.ai",
    linkedinUrl: "https://www.linkedin.com/in/florentcrivello",
    tier: "TIER_1",
    status: "NEW",
    tags: ["ceo", "founder", "ai-assistant"],
  },
  {
    email: "tyler@voiceflow.com",
    firstName: "Tyler",
    lastName: "Han",
    company: "Voiceflow",
    jobTitle: "Chief Technology Officer",
    website: "https://voiceflow.com",
    linkedinUrl: "https://www.linkedin.com/in/tylerhhan",
    tier: "TIER_1",
    status: "NEW",
    tags: ["cto", "conversational-ai", "agents"],
  },
  {
    email: "darius.a@noota.io",
    firstName: "Darius",
    lastName: "Al Naddaf",
    company: "Noota",
    jobTitle: "Chief Technology Officer",
    website: "https://noota.io",
    linkedinUrl: "https://www.linkedin.com/in/darius-alnaddaf-9792b2b7",
    tier: "TIER_1",
    status: "NEW",
    tags: ["cto", "voice-ai", "saas"],
  },
  {
    email: "kai.bakker@datasnipper.com",
    firstName: "Kai",
    lastName: "Bakker",
    company: "DataSnipper",
    jobTitle: "Founder",
    website: "https://datasnipper.com",
    linkedinUrl: "https://www.linkedin.com/in/kaibakker",
    tier: "TIER_1",
    status: "NEW",
    tags: ["founder", "audit-ai", "saas"],
  },
  {
    email: "nate@continue.dev",
    firstName: "Nate",
    lastName: "Sesti",
    company: "Continue",
    jobTitle: "Chief Technology Officer",
    website: "https://continue.dev",
    linkedinUrl: "https://www.linkedin.com/in/natesesti",
    tier: "TIER_1",
    status: "NEW",
    tags: ["cto", "ai-ide", "open-source"],
  },
  {
    email: "saoud@cline.bot",
    firstName: "Saoud",
    lastName: "Rizwan",
    company: "Cline",
    jobTitle: "CEO",
    website: "https://cline.bot",
    linkedinUrl: "https://www.linkedin.com/in/saoud-rizwan",
    tier: "TIER_1",
    status: "NEW",
    tags: ["ceo", "founder", "ai-coding"],
  },
  {
    email: "robin@kater.ai",
    firstName: "Robin",
    lastName: "Seitz",
    company: "Kater AI",
    jobTitle: "Chief Technology Officer",
    website: "https://kater.ai",
    linkedinUrl: "https://www.linkedin.com/in/robin-seitz-12029970",
    tier: "TIER_1",
    status: "NEW",
    tags: ["cto", "data-analytics", "llm"],
  },
  {
    email: "nurasyl@remofirst.com",
    firstName: "Nurasyl",
    lastName: "Serik",
    company: "RemoFirst",
    jobTitle: "CEO",
    website: "https://remofirst.com",
    linkedinUrl: "https://www.linkedin.com/in/nurasyl",
    tier: "TIER_1",
    status: "NEW",
    tags: ["ceo", "founder", "hr-tech"],
  },
  {
    email: "spolu@dust.tt",
    firstName: "Stanislas",
    lastName: "Polu",
    company: "Dust",
    jobTitle: "Software Engineer",
    website: "https://dust.tt",
    linkedinUrl: "https://www.linkedin.com/in/spolu",
    tier: "TIER_1",
    status: "NEW",
    tags: ["founder", "ai-workspace", "agents"],
  },
  {
    email: "varun@gohighlevel.com",
    firstName: "Varun",
    lastName: "Vairavan",
    company: "GoHighLevel",
    jobTitle: "Co-Founder",
    website: "https://gohighlevel.com",
    linkedinUrl: "https://www.linkedin.com/in/varun-vairavan-6a879214",
    tier: "TIER_1",
    status: "NEW",
    tags: ["founder", "crm", "saas"],
  },
];

// ─── TIER_2 — Engineers / PMs / senior ICs at AI companies ───────────────────
const tier2Prospects = [
  {
    email: "everett.berry@clay.com",
    firstName: "Everett",
    lastName: "Berry",
    company: "Clay",
    jobTitle: null,
    website: "https://clay.com",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["engineer", "data-enrichment", "saas"],
  },
  {
    email: "fabian@lovable.dev",
    firstName: "Fabian",
    lastName: "Hedin",
    company: "Lovable",
    jobTitle: null,
    website: "https://lovable.dev",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["engineer", "ai-builder", "no-code"],
  },
  {
    email: "siva@harvey.ai",
    firstName: "Siva",
    lastName: "Gurumurthy",
    company: "Harvey AI",
    jobTitle: null,
    website: "https://harvey.ai",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["engineer", "legal-ai", "llm"],
  },
  {
    email: "alexander.matthey@parloa.com",
    firstName: "Alexander",
    lastName: "Matthey",
    company: "Parloa",
    jobTitle: null,
    website: "https://parloa.com",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["engineer", "voice-ai", "saas"],
  },
  {
    email: "tumas@rogo.ai",
    firstName: "Tumas",
    lastName: "Rackaitis",
    company: "Rogo",
    jobTitle: null,
    website: "https://rogo.ai",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["engineer", "finance-ai", "llm"],
  },
  {
    email: "eiso@poolside.ai",
    firstName: "Eiso",
    lastName: "Kant",
    company: "Poolside AI",
    jobTitle: null,
    website: "https://poolside.ai",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["engineer", "code-gen", "llm"],
  },
  {
    email: "max@cusp.ai",
    firstName: "Max",
    lastName: "Welling",
    company: "Cusp AI",
    jobTitle: "Chief Technology Officer",
    website: "https://cusp.ai",
    linkedinUrl: "https://www.linkedin.com/in/max-welling-4a783910",
    tier: "TIER_2",
    status: "NEW",
    tags: ["cto", "research", "ml"],
  },
  {
    email: "kai.wang@uber.com",
    firstName: "Kai",
    lastName: "Wang",
    company: "Uber",
    jobTitle: "Software Engineer",
    website: "https://uber.com",
    linkedinUrl: "https://www.linkedin.com/in/yu-kai-wang-18746021a",
    tier: "TIER_2",
    status: "NEW",
    tags: ["engineer", "big-tech", "ml"],
  },
  {
    email: "rlaycock@thoughtworks.com",
    firstName: "Rachel",
    lastName: "Laycock",
    company: "Thoughtworks",
    jobTitle: "Chief Technology Officer",
    website: "https://thoughtworks.com",
    linkedinUrl: "https://www.linkedin.com/in/rachellaycock",
    tier: "TIER_2",
    status: "NEW",
    tags: ["cto", "consulting", "engineering"],
  },
  {
    email: "scott@kilocode.ai",
    firstName: "Scott",
    lastName: "Breitenother",
    company: "Kilo Code",
    jobTitle: null,
    website: "https://kilocode.ai",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "ai-coding", "vscode"],
  },
  {
    email: "taner@flower.ai",
    firstName: "Taner",
    lastName: "Topal",
    company: "Flower AI",
    jobTitle: null,
    website: "https://flower.ai",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["engineer", "federated-learning", "ml"],
  },
  {
    email: "julian@hedy.ai",
    firstName: "Julian",
    lastName: "Pscheid",
    company: "Hedy AI",
    jobTitle: null,
    website: "https://hedy.ai",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "ai-assistant", "saas"],
  },
  {
    email: "k.anand@f5.com",
    firstName: "Kunal",
    lastName: "Anand",
    company: "F5",
    jobTitle: "Chief Innovation Officer",
    website: "https://f5.com",
    linkedinUrl: "https://www.linkedin.com/in/kunalanand",
    tier: "TIER_2",
    status: "NEW",
    tags: ["cio", "enterprise", "networking"],
  },
  {
    email: "mehmet-sinan@useinsider.com",
    firstName: "Mehmet Sinan",
    lastName: "Toktay",
    company: "Insider",
    jobTitle: null,
    website: "https://useinsider.com",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["engineer", "martech", "saas"],
  },
  {
    email: "dsukhtankar@smartasset.com",
    firstName: "Durgesh",
    lastName: "Sukhtankar",
    company: "SmartAsset",
    jobTitle: null,
    website: "https://smartasset.com",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["engineer", "fintech", "saas"],
  },
  {
    email: "eduardo@maihem.ai",
    firstName: "Eduardo",
    lastName: "Candela",
    company: "Maihem AI",
    jobTitle: null,
    website: "https://maihem.ai",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "ai-testing", "llm"],
  },
  // ── Leads without email (no-email from CSV — kept for completeness) ─────────
  // Sigge Labor / leya.law — no email in CSV, skipped
  // Jacob Duligall / ivocontract.com — no email in CSV, skipped
  // T.R. Vishwanath / glean.com — no email in CSV, skipped
  // Paul Onnen / goodnotes.com — no email in CSV, skipped
  // Alexander Holt / elevenlabs.io — no email in CSV, skipped
  // Lutz Kirchner / aleph-alpha.com — no email in CSV, skipped
  // Nipun Dave / typeface.ai — no email in CSV, skipped
  // Denis Yarats / perplexity.ai — no email in CSV, skipped
  // Nicolas Silberstein Camara / mendable.ai — no email in CSV, skipped
  // Stephen Roberts / mindfoundry.ai — no email in CSV, skipped
  // Magnus Langanke / superscale.io — no email in CSV, skipped
  // Alon Gubkin / aporia.com — no email in CSV, skipped
  // Sashank Gondala / further.ai — no email in CSV, skipped
  // Claudius Jähn / deepl.com — no email in CSV, skipped
  // Eli Bullock-Papa / paxhistoria.io — no email in CSV, skipped
  {
    email: "andrew.parker@newsela.com",
    firstName: "Andrew",
    lastName: "Parker",
    company: "Newsela",
    jobTitle: null,
    website: "https://newsela.com",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["engineer", "edtech", "saas"],
  },
  {
    email: "alex.lebrun@wit.ai",
    firstName: "Alex",
    lastName: "Lebrun",
    company: "Wit.ai",
    jobTitle: "Co-Founder",
    website: "https://wit.ai",
    linkedinUrl: "https://www.linkedin.com/in/alexlebrun",
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "nlp", "ai"],
  },
  {
    email: "cto@cohere.com",
    firstName: "Ivan",
    lastName: "Zhang",
    company: "Cohere",
    jobTitle: "Co-Founder & CTO",
    website: "https://cohere.com",
    linkedinUrl: "https://www.linkedin.com/in/ivanzh",
    tier: "TIER_2",
    status: "NEW",
    tags: ["cto", "llm", "enterprise-ai"],
  },
  {
    email: "eng@together.ai",
    firstName: "Chris",
    lastName: "Re",
    company: "Together AI",
    jobTitle: "Co-Founder",
    website: "https://together.ai",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "inference", "llm"],
  },
  {
    email: "dev@fireworks.ai",
    firstName: "Lin",
    lastName: "Qiao",
    company: "Fireworks AI",
    jobTitle: "CEO",
    website: "https://fireworks.ai",
    linkedinUrl: "https://www.linkedin.com/in/linqiao",
    tier: "TIER_2",
    status: "NEW",
    tags: ["ceo", "inference", "llm"],
  },
  {
    email: "team@modal.com",
    firstName: "Erik",
    lastName: "Bernhardsson",
    company: "Modal",
    jobTitle: "CEO",
    website: "https://modal.com",
    linkedinUrl: "https://www.linkedin.com/in/erikbern",
    tier: "TIER_2",
    status: "NEW",
    tags: ["ceo", "cloud", "ml-infra"],
  },
  {
    email: "hello@replicate.com",
    firstName: "Ben",
    lastName: "Firshman",
    company: "Replicate",
    jobTitle: "Co-Founder",
    website: "https://replicate.com",
    linkedinUrl: "https://www.linkedin.com/in/bfirsh",
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "ml-infra", "open-source"],
  },
  {
    email: "contact@baseten.co",
    firstName: "Tuhin",
    lastName: "Srivastava",
    company: "Baseten",
    jobTitle: "Co-Founder & CEO",
    website: "https://baseten.co",
    linkedinUrl: "https://www.linkedin.com/in/tuhin-srivastava",
    tier: "TIER_2",
    status: "NEW",
    tags: ["ceo", "ml-infra", "deployment"],
  },
  {
    email: "team@vellum.ai",
    firstName: "Akash",
    lastName: "Sharma",
    company: "Vellum AI",
    jobTitle: "Co-Founder",
    website: "https://vellum.ai",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "llm-ops", "saas"],
  },
  {
    email: "hello@langfuse.com",
    firstName: "Clemens",
    lastName: "Rawert",
    company: "Langfuse",
    jobTitle: "Co-Founder",
    website: "https://langfuse.com",
    linkedinUrl: "https://www.linkedin.com/in/clemensrawert",
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "llm-observability", "open-source"],
  },
  {
    email: "team@helicone.ai",
    firstName: "Scott",
    lastName: "Nguyen",
    company: "Helicone",
    jobTitle: "Co-Founder",
    website: "https://helicone.ai",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "llm-observability", "saas"],
  },
  {
    email: "contact@portkey.ai",
    firstName: "Rohit",
    lastName: "Agarwal",
    company: "Portkey AI",
    jobTitle: "Co-Founder",
    website: "https://portkey.ai",
    linkedinUrl: "https://www.linkedin.com/in/rohitagarwal88",
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "llm-gateway", "enterprise"],
  },
  {
    email: "team@traceloop.com",
    firstName: "Nir",
    lastName: "Gazit",
    company: "Traceloop",
    jobTitle: "Co-Founder",
    website: "https://traceloop.com",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "llm-observability", "opentelemetry"],
  },
  {
    email: "hello@brainlid.org",
    firstName: "Mark",
    lastName: "Erickson",
    company: "Brainlid",
    jobTitle: "Founder",
    website: "https://brainlid.org",
    linkedinUrl: null,
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "ai-tools", "indie"],
  },
  {
    email: "team@openrouter.ai",
    firstName: "Alex",
    lastName: "Atallah",
    company: "OpenRouter",
    jobTitle: "Co-Founder",
    website: "https://openrouter.ai",
    linkedinUrl: "https://www.linkedin.com/in/alexatallah",
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "llm-routing", "api"],
  },
  {
    email: "contact@wordware.ai",
    firstName: "Filip",
    lastName: "Kozera",
    company: "Wordware",
    jobTitle: "Co-Founder",
    website: "https://wordware.ai",
    linkedinUrl: "https://www.linkedin.com/in/filipkozera",
    tier: "TIER_2",
    status: "NEW",
    tags: ["founder", "ai-builder", "no-code"],
  },
];

async function main() {
  console.log("🌱 Seeding outreach prospects and templates...");

  console.log(`  → Upserting ${tier1Prospects.length} TIER_1 prospects...`);
  for (const prospect of tier1Prospects) {
    const templateCategory = inferCategory(prospect.tags);
    await prisma.outreachProspect.upsert({
      where: { email: prospect.email },
      update: {
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        company: prospect.company,
        jobTitle: prospect.jobTitle,
        website: prospect.website,
        linkedinUrl: prospect.linkedinUrl,
        tier: prospect.tier,
        tags: prospect.tags,
        templateCategory,
      },
      create: { ...prospect, templateCategory },
    });
  }

  console.log(`  → Upserting ${tier2Prospects.length} TIER_2 prospects...`);
  for (const prospect of tier2Prospects) {
    const templateCategory = inferCategory(prospect.tags);
    await prisma.outreachProspect.upsert({
      where: { email: prospect.email },
      update: {
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        company: prospect.company,
        jobTitle: prospect.jobTitle,
        website: prospect.website,
        linkedinUrl: prospect.linkedinUrl,
        tier: prospect.tier,
        tags: prospect.tags,
        templateCategory,
      },
      create: { ...prospect, templateCategory },
    });
  }

  console.log(
    `  → Upserting ${outreachTemplates.length} email templates (7 categories × 3 steps)...`,
  );
  for (const template of outreachTemplates) {
    await prisma.outreachTemplate.upsert({
      where: {
        step_category: { step: template.step, category: template.category },
      },
      update: {
        name: template.name,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
        variables: template.variables,
      },
      create: template,
    });
  }

  const tier1Count = await prisma.outreachProspect.count({
    where: { tier: "TIER_1" },
  });
  const tier2Count = await prisma.outreachProspect.count({
    where: { tier: "TIER_2" },
  });
  const templateCount = await prisma.outreachTemplate.count();

  console.log(`\n✅ Seed complete:`);
  console.log(`   TIER_1 prospects: ${tier1Count}`);
  console.log(`   TIER_2 prospects: ${tier2Count}`);
  console.log(`   Templates: ${templateCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
