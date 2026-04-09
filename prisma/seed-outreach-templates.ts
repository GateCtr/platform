/**
 * Outreach email templates — 7 categories × 3 steps = 21 templates
 *
 * Categories:
 *   general       — fallback for any prospect
 *   agents        — autonomous agents (Cognition/Devin, Lindy, Mem0, Zep, Maihem)
 *   rag           — RAG / document search (Greptile, Harvey, Leya, Ivo, Glean)
 *   code-gen      — code generation (Cursor, Lovable, Continue.dev, Cline, Kilo Code)
 *   voice-ai      — voice / audio / transcription (Noota, Nabla, Parloa, Voiceflow, ElevenLabs)
 *   saas-ai       — SaaS with embedded AI feature (GoHighLevel, DataSnipper, RemoFirst)
 *   data-analytics — LLM on structured data in batch (Kater AI, Clay, DataSnipper)
 *
 * Variables available: {{firstName}}, {{lastName}}, {{company}}, {{jobTitle}}, {{senderName}}
 *
 * Principles applied:
 *   - Step 1 line 1: specific observation about their product/use-case, never generic
 *   - Step 2: introduces ONE new piece of information, never repeats step 1 argument
 *   - Step 3: clean exit + reactivation hook ("reply yes in 3 months")
 *   - Subject: specific to their pain, never "{{company}} + LLM costs"
 *   - Body: max 6 lines, no bullet points, no titles, no feature lists
 */

// ─── Shared closing ───────────────────────────────────────────────────────────

const closing = (name: string) =>
  `<p>${name}<br><a href="https://gatectr.com" style="color:#0066cc;">gatectr.com</a></p>`;

const closingText = (name: string) => `${name}\ngatectr.com`;

// ─── Templates ────────────────────────────────────────────────────────────────

export const outreachTemplates = [
  // ══════════════════════════════════════════════════════════════════════════
  // GENERAL — fallback
  // ══════════════════════════════════════════════════════════════════════════

  {
    step: 1,
    category: "general",
    name: "General — Initial",
    subject: "{{company}} — LLM spend without guardrails",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Most LLM teams at {{company}}'s stage discover their real token cost on the monthly invoice — not in real time. By then the spend is already done.</p>
<p>GateCtr compresses context before every call and applies hard caps per team, project, or user. Requests are blocked before the LLM call, not logged after. Teams cut token usage 35–40%. One endpoint swap.</p>
<p>Can I set up a free account so you can run it against real {{company}} traffic this week?</p>
<p>Yes or no works.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Most LLM teams at {{company}}'s stage discover their real token cost on the monthly invoice — not in real time. By then the spend is already done.

GateCtr compresses context before every call and applies hard caps per team, project, or user. Requests are blocked before the LLM call, not logged after. Teams cut token usage 35–40%. One endpoint swap.

Can I set up a free account so you can run it against real {{company}} traffic this week?

Yes or no works.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 2,
    category: "general",
    name: "General — Follow-up",
    subject: "Re: {{company}} — LLM spend without guardrails",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>One thing I didn't mention: GateCtr also routes simple requests to cheaper models automatically — without changing any code at {{company}}. The routing is based on request complexity, not a fixed rule, so quality on complex tasks is unchanged.</p>
<p>Do you want me to open the access?</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

One thing I didn't mention: GateCtr also routes simple requests to cheaper models automatically — without changing any code at {{company}}. The routing is based on request complexity, not a fixed rule, so quality on complex tasks is unchanged.

Do you want me to open the access?

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 3,
    category: "general",
    name: "General — Final",
    subject: "Last note — {{company}}",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>If LLM spend isn't a priority at {{company}} right now — no problem. If it becomes one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

If LLM spend isn't a priority at {{company}} right now — no problem. If it becomes one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AGENTS — autonomous agents, background loops, unbounded token chains
  // Prospects: Cognition/Devin, Lindy, Mem0, Zep, Maihem, Kater
  // ══════════════════════════════════════════════════════════════════════════

  {
    step: 1,
    category: "agents",
    name: "Agents — Initial",
    subject: "{{company}} — unbounded agent runs",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Agent frameworks don't have a native way to stop an LLM call mid-run — the cost of a loop that runs 10x longer than expected shows up on the invoice, not in the code.</p>
<p>GateCtr applies a hard cap per agent run, blocked before the API call, and returns a clean error the code can handle. It also compresses context between steps — 35–40% on multi-turn chains. One endpoint swap.</p>
<p>Can I set up a free account so you can test it on a real {{company}} agent this week?</p>
<p>Yes or no works.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Agent frameworks don't have a native way to stop an LLM call mid-run — the cost of a loop that runs 10x longer than expected shows up on the invoice, not in the code.

GateCtr applies a hard cap per agent run, blocked before the API call, and returns a clean error the code can handle. It also compresses context between steps — 35–40% on multi-turn chains. One endpoint swap.

Can I set up a free account so you can test it on a real {{company}} agent this week?

Yes or no works.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 2,
    category: "agents",
    name: "Agents — Follow-up",
    subject: "Re: {{company}} — unbounded agent runs",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>One thing I didn't mention: not every step in a {{company}} agent needs GPT-4o or Claude Sonnet. GateCtr routes sub-tasks to cheaper models automatically based on request complexity — without changing the agent logic. The savings stack on top of the compression.</p>
<p>Do you want me to open the access?</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

One thing I didn't mention: not every step in a {{company}} agent needs GPT-4o or Claude Sonnet. GateCtr routes sub-tasks to cheaper models automatically based on request complexity — without changing the agent logic. The savings stack on top of the compression.

Do you want me to open the access?

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 3,
    category: "agents",
    name: "Agents — Final",
    subject: "Last note — {{company}}",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>If agent cost control isn't on the roadmap at {{company}} right now — no problem. If it becomes one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

If agent cost control isn't on the roadmap at {{company}} right now — no problem. If it becomes one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RAG — retrieval-augmented generation, large context, document search
  // Prospects: Greptile, Harvey AI, Leya, Ivo, Glean, Mendable
  // ══════════════════════════════════════════════════════════════════════════

  {
    step: 1,
    category: "rag",
    name: "RAG — Initial",
    subject: "{{company}} — tokens in, noise out",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>RAG pipelines retrieve more context than the model actually uses. The extra chunks are billed — they don't change the answer.</p>
<p>GateCtr removes that redundant context before it reaches OpenAI or Anthropic, without touching the retrieval logic or the prompts. 35–40% reduction. One endpoint swap.</p>
<p>Can I set up a free account so you can run it against real {{company}} queries this week?</p>
<p>Yes or no works.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

RAG pipelines retrieve more context than the model actually uses. The extra chunks are billed — they don't change the answer.

GateCtr removes that redundant context before it reaches OpenAI or Anthropic, without touching the retrieval logic or the prompts. 35–40% reduction. One endpoint swap.

Can I set up a free account so you can run it against real {{company}} queries this week?

Yes or no works.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 2,
    category: "rag",
    name: "RAG — Follow-up",
    subject: "Re: {{company}} — tokens in, noise out",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>One thing I didn't mention: GateCtr also caches semantically similar queries. If {{company}} users ask variations of the same question, only the first call hits the LLM — the rest cost zero. For a document search product with overlapping queries, that adds up on top of the compression.</p>
<p>Do you want me to open the access?</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

One thing I didn't mention: GateCtr also caches semantically similar queries. If {{company}} users ask variations of the same question, only the first call hits the LLM — the rest cost zero. For a document search product with overlapping queries, that adds up on top of the compression.

Do you want me to open the access?

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 3,
    category: "rag",
    name: "RAG — Final",
    subject: "Last note — {{company}}",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>If context costs aren't a priority at {{company}} right now — no problem. If they become one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

If context costs aren't a priority at {{company}} right now — no problem. If they become one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CODE-GEN — code generation, IDE, developer tools
  // Prospects: Cursor, Lovable, Continue.dev, Cline, Kilo Code, Poolside
  // ══════════════════════════════════════════════════════════════════════════

  {
    step: 1,
    category: "code-gen",
    name: "Code-Gen — Initial",
    subject: "{{company}} — context sent vs context used",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Code generation sends the full file, the diff, and the conversation history on every request. The model uses maybe 20% of that to produce the completion. The rest is billed.</p>
<p>GateCtr compresses that before it reaches Claude or GPT-4o — 35–40% reduction per request without touching output quality. One endpoint swap.</p>
<p>Can I set up a free account so you can test it on real {{company}} traffic this week?</p>
<p>Yes or no works.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Code generation sends the full file, the diff, and the conversation history on every request. The model uses maybe 20% of that to produce the completion. The rest is billed.

GateCtr compresses that before it reaches Claude or GPT-4o — 35–40% reduction per request without touching output quality. One endpoint swap.

Can I set up a free account so you can test it on real {{company}} traffic this week?

Yes or no works.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 2,
    category: "code-gen",
    name: "Code-Gen — Follow-up",
    subject: "Re: {{company}} — context sent vs context used",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>One thing I didn't mention: a power user at {{company}} who runs 50 generations in a day can cost as much as 200 normal users. GateCtr lets you set a per-user token budget — blocked before the API call, not after. That's the lever most code-gen teams don't have natively.</p>
<p>Do you want me to open the access?</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

One thing I didn't mention: a power user at {{company}} who runs 50 generations in a day can cost as much as 200 normal users. GateCtr lets you set a per-user token budget — blocked before the API call, not after. That's the lever most code-gen teams don't have natively.

Do you want me to open the access?

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 3,
    category: "code-gen",
    name: "Code-Gen — Final",
    subject: "Last note — {{company}}",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>If LLM cost per generation isn't a priority at {{company}} right now — no problem. If it becomes one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

If LLM cost per generation isn't a priority at {{company}} right now — no problem. If it becomes one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VOICE-AI — voice, audio, transcription, meeting AI
  // Prospects: Noota, Nabla, Parloa, Voiceflow, ElevenLabs
  // ══════════════════════════════════════════════════════════════════════════

  {
    step: 1,
    category: "voice-ai",
    name: "Voice-AI — Initial",
    subject: "{{company}} — 1 hour of audio = how many tokens?",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>A 1-hour transcription passed to the LLM for summarization typically runs 50–80K tokens. If {{company}} processes thousands of sessions per month, that context cost compounds — and it's mostly filler speech and repetition the model doesn't need.</p>
<p>GateCtr compresses that context before it hits the model — 35–40% reduction without affecting summary quality. One endpoint swap.</p>
<p>Can I set up a free account so you can test it on real {{company}} transcriptions this week?</p>
<p>Yes or no works.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

A 1-hour transcription passed to the LLM for summarization typically runs 50–80K tokens. If {{company}} processes thousands of sessions per month, that context cost compounds — and it's mostly filler speech and repetition the model doesn't need.

GateCtr compresses that context before it hits the model — 35–40% reduction without affecting summary quality. One endpoint swap.

Can I set up a free account so you can test it on real {{company}} transcriptions this week?

Yes or no works.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 2,
    category: "voice-ai",
    name: "Voice-AI — Follow-up",
    subject: "Re: {{company}} — 1 hour of audio = how many tokens?",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>One thing I didn't mention: GateCtr lets you set a hard cap per session or per client. If a {{company}} customer records a 4-hour session, the budget you set upfront is what gets enforced — the cap blocks before the LLM call, so one outlier client can't throw off the monthly budget.</p>
<p>Do you want me to open the access?</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

One thing I didn't mention: GateCtr lets you set a hard cap per session or per client. If a {{company}} customer records a 4-hour session, the budget you set upfront is what gets enforced — the cap blocks before the LLM call, so one outlier client can't throw off the monthly budget.

Do you want me to open the access?

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 3,
    category: "voice-ai",
    name: "Voice-AI — Final",
    subject: "Last note — {{company}}",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>If LLM cost on audio isn't a priority at {{company}} right now — no problem. If it becomes one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

If LLM cost on audio isn't a priority at {{company}} right now — no problem. If it becomes one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SAAS-AI — SaaS with embedded AI feature, no cost model for it
  // Prospects: GoHighLevel, DataSnipper, RemoFirst
  // ══════════════════════════════════════════════════════════════════════════

  {
    step: 1,
    category: "saas-ai",
    name: "SaaS-AI — Initial",
    subject: "{{company}} AI feature — cost per user",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>When a SaaS adds an AI feature, the billing model usually doesn't change — but the cost structure does. One active user running 50 AI requests in a day can cost more than 200 passive users. There's no native way to limit that.</p>
<p>GateCtr adds per-user token budgets on top of your existing API calls — enforced before the LLM call, not logged after. Teams that shipped an AI feature without cost guardrails use it to fix the margin model without touching the product code. One endpoint swap.</p>
<p>Can I set up a free account so you can test it on real {{company}} traffic this week?</p>
<p>Yes or no works.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

When a SaaS adds an AI feature, the billing model usually doesn't change — but the cost structure does. One active user running 50 AI requests in a day can cost more than 200 passive users. There's no native way to limit that.

GateCtr adds per-user token budgets on top of your existing API calls — enforced before the LLM call, not logged after. Teams that shipped an AI feature without cost guardrails use it to fix the margin model without touching the product code. One endpoint swap.

Can I set up a free account so you can test it on real {{company}} traffic this week?

Yes or no works.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 2,
    category: "saas-ai",
    name: "SaaS-AI — Follow-up",
    subject: "Re: {{company}} AI feature — cost per user",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>One thing I didn't mention: if the {{company}} AI feature processes user-submitted content — documents, records, emails — a portion of that context is redundant across requests. GateCtr removes it before billing. 30–40% reduction on user-content workloads, on top of the per-user caps.</p>
<p>Do you want me to open the access?</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

One thing I didn't mention: if the {{company}} AI feature processes user-submitted content — documents, records, emails — a portion of that context is redundant across requests. GateCtr removes it before billing. 30–40% reduction on user-content workloads, on top of the per-user caps.

Do you want me to open the access?

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 3,
    category: "saas-ai",
    name: "SaaS-AI — Final",
    subject: "Last note — {{company}}",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>If the AI feature margin isn't a priority at {{company}} right now — no problem. If it becomes one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

If the AI feature margin isn't a priority at {{company}} right now — no problem. If it becomes one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DATA-ANALYTICS — LLM on structured data in batch
  // Prospects: Kater AI, Clay, DataSnipper
  // ══════════════════════════════════════════════════════════════════════════

  {
    step: 1,
    category: "data-analytics",
    name: "Data-Analytics — Initial",
    subject: "{{company}} — LLM cost per row",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Running an LLM on structured data at scale has a specific problem: each row gets a fresh context window, even when 70% of that context is identical — the schema, the instructions, the examples. That repetition is what drives the cost up at {{company}}.</p>
<p>GateCtr deduplicates and compresses that shared context before it reaches the model — 35–40% reduction without changing the data pipeline. One endpoint swap.</p>
<p>Can I set up a free account so you can test it on a real {{company}} batch this week?</p>
<p>Yes or no works.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Running an LLM on structured data at scale has a specific problem: each row gets a fresh context window, even when 70% of that context is identical — the schema, the instructions, the examples. That repetition is what drives the cost up at {{company}}.

GateCtr deduplicates and compresses that shared context before it reaches the model — 35–40% reduction without changing the data pipeline. One endpoint swap.

Can I set up a free account so you can test it on a real {{company}} batch this week?

Yes or no works.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 2,
    category: "data-analytics",
    name: "Data-Analytics — Follow-up",
    subject: "Re: {{company}} — LLM cost per row",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>One thing I didn't mention: GateCtr also lets you set a hard cap per batch job. An uncontrolled enrichment run on a large dataset won't blow the monthly budget — the cap stops the job at the LLM call level, before the cost is incurred.</p>
<p>Do you want me to open the access?</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

One thing I didn't mention: GateCtr also lets you set a hard cap per batch job. An uncontrolled enrichment run on a large dataset won't blow the monthly budget — the cap stops the job at the LLM call level, before the cost is incurred.

Do you want me to open the access?

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 3,
    category: "data-analytics",
    name: "Data-Analytics — Final",
    subject: "Last note — {{company}}",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>If LLM cost per batch isn't a priority at {{company}} right now — no problem. If it becomes one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

If LLM cost per batch isn't a priority at {{company}} right now — no problem. If it becomes one in 3 months, reply "yes" and I'll set up the access. Free plan, 5 minutes.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },
];
