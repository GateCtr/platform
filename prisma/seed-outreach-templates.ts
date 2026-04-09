/**
 * Outreach email templates — 5 categories × 3 steps = 15 templates
 *
 * Categories:
 *   general   — fallback for any prospect
 *   agents    — autonomous agents (Cognition/Devin, Lindy, Mem0, Zep, Maihem)
 *   rag       — RAG / document search (Greptile, Harvey, Leya, Ivo, Glean)
 *   code-gen  — code generation (Cursor, Lovable, Continue.dev, Cline, Kilo Code)
 *   voice-ai  — voice / audio / transcription (Noota, Nabla, Parloa, Voiceflow, ElevenLabs)
 *
 * Variables available: {{firstName}}, {{lastName}}, {{company}}, {{jobTitle}}, {{senderName}}
 *
 * Principles applied:
 *   - Line 1: observation about THEM, not about us
 *   - CTA: binary yes/no, no call required
 *   - No "I'm building", no feature lists
 *   - Subject: specific to their context
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
    subject: "{{company}} + LLM costs",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>{{company}} is routing a lot of LLM calls. A chunk of those tokens are redundant context that never needed to be sent.</p>
<p>GateCtr compresses that context before it hits OpenAI or Anthropic — teams cut token usage 35–40% without touching their code. One endpoint swap.</p>
<p>Can I set up a free account so you can run it against real {{company}} traffic this week?</p>
<p>Yes or no works.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

{{company}} is routing a lot of LLM calls. A chunk of those tokens are redundant context that never needed to be sent.

GateCtr compresses that context before it hits OpenAI or Anthropic — teams cut token usage 35–40% without touching their code. One endpoint swap.

Can I set up a free account so you can run it against real {{company}} traffic this week?

Yes or no works.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 2,
    category: "general",
    name: "General — Follow-up",
    subject: "Re: {{company}} + LLM costs",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Following up. The offer stands — free access, your real traffic, this week.</p>
<p>One question: do you want me to open the account?</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Following up. The offer stands — free access, your real traffic, this week.

One question: do you want me to open the account?

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
<p>Last message from me.</p>
<p>If LLM costs aren't a priority at {{company}} right now — no problem, I'll check back later. If they are: reply "yes" and I'll set up the access directly. Free plan, 5-minute setup.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Last message from me.

If LLM costs aren't a priority at {{company}} right now — no problem, I'll check back later. If they are: reply "yes" and I'll set up the access directly. Free plan, 5-minute setup.

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
    subject: "{{company}} — agent token loops",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Autonomous agents are the hardest LLM cost to predict — one loop that runs longer than expected and the monthly bill doubles. {{company}} is probably already dealing with this.</p>
<p>GateCtr puts a hard cap per agent run before the LLM call. If the budget is hit, the request is blocked — not logged after the fact. It also compresses the context passed between steps, which cuts token usage 35–40% on multi-turn chains.</p>
<p>Can I set up a free account so you can test it on a real {{company}} agent this week?</p>
<p>Yes or no works — no call needed.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Autonomous agents are the hardest LLM cost to predict — one loop that runs longer than expected and the monthly bill doubles. {{company}} is probably already dealing with this.

GateCtr puts a hard cap per agent run before the LLM call. If the budget is hit, the request is blocked — not logged after the fact. It also compresses the context passed between steps, which cuts token usage 35–40% on multi-turn chains.

Can I set up a free account so you can test it on a real {{company}} agent this week?

Yes or no works — no call needed.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 2,
    category: "agents",
    name: "Agents — Follow-up",
    subject: "Re: {{company}} — agent token loops",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Following up. One concrete thing: with GateCtr, if an agent at {{company}} hits its token budget mid-run, it gets a clean error it can handle — not a surprise invoice at the end of the month.</p>
<p>Do you want me to open the access?</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Following up. One concrete thing: with GateCtr, if an agent at {{company}} hits its token budget mid-run, it gets a clean error it can handle — not a surprise invoice at the end of the month.

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
<p>Last message. If agent cost control isn't on the roadmap at {{company}} yet — I'll check back. If it is: reply "yes" and I'll set up the access. Free plan, 5 minutes.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Last message. If agent cost control isn't on the roadmap at {{company}} yet — I'll check back. If it is: reply "yes" and I'll set up the access. Free plan, 5 minutes.

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
    subject: "{{company}} — context window costs",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>RAG pipelines send a lot of retrieved context to the LLM — most of it is noise that doesn't affect the answer. That's where the token cost lives at {{company}}.</p>
<p>GateCtr compresses and prunes that context before it hits OpenAI or Anthropic. Teams doing similar RAG workloads cut token usage 35–40% without changing their retrieval logic. One endpoint swap.</p>
<p>Can I set up a free account so you can run it against real {{company}} queries this week?</p>
<p>Yes or no works.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

RAG pipelines send a lot of retrieved context to the LLM — most of it is noise that doesn't affect the answer. That's where the token cost lives at {{company}}.

GateCtr compresses and prunes that context before it hits OpenAI or Anthropic. Teams doing similar RAG workloads cut token usage 35–40% without changing their retrieval logic. One endpoint swap.

Can I set up a free account so you can run it against real {{company}} queries this week?

Yes or no works.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 2,
    category: "rag",
    name: "RAG — Follow-up",
    subject: "Re: {{company}} — context window costs",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Following up. The compression works at the context level — it doesn't touch your retrieval pipeline or your prompts. {{company}} keeps full control of what gets retrieved; GateCtr just removes the redundant parts before they're billed.</p>
<p>Do you want me to open the access?</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Following up. The compression works at the context level — it doesn't touch your retrieval pipeline or your prompts. {{company}} keeps full control of what gets retrieved; GateCtr just removes the redundant parts before they're billed.

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
<p>Last message. If context costs aren't a priority at {{company}} right now — no problem. If they are: reply "yes" and I'll set up the access. Free plan, 5 minutes.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Last message. If context costs aren't a priority at {{company}} right now — no problem. If they are: reply "yes" and I'll set up the access. Free plan, 5 minutes.

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
    subject: "{{company}} — LLM cost per generation",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Code generation sends large context windows to the LLM on every request — the full file, the diff, the conversation history. Most of that context is repeated across calls and doesn't change the output.</p>
<p>GateCtr compresses that before it hits Claude or GPT-4o. Teams doing similar code-gen workloads cut token usage 35–40% per request without touching output quality. One endpoint swap.</p>
<p>Can I set up a free account so you can test it on real {{company}} traffic this week?</p>
<p>Yes or no works — no call needed.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Code generation sends large context windows to the LLM on every request — the full file, the diff, the conversation history. Most of that context is repeated across calls and doesn't change the output.

GateCtr compresses that before it hits Claude or GPT-4o. Teams doing similar code-gen workloads cut token usage 35–40% per request without touching output quality. One endpoint swap.

Can I set up a free account so you can test it on real {{company}} traffic this week?

Yes or no works — no call needed.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 2,
    category: "code-gen",
    name: "Code-Gen — Follow-up",
    subject: "Re: {{company}} — LLM cost per generation",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Following up. One thing worth knowing: GateCtr also routes simple requests to cheaper models automatically — so not every {{company}} generation needs GPT-4o. The routing is based on request complexity, not a fixed rule.</p>
<p>Do you want me to open the access?</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Following up. One thing worth knowing: GateCtr also routes simple requests to cheaper models automatically — so not every {{company}} generation needs GPT-4o. The routing is based on request complexity, not a fixed rule.

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
<p>Last message. If LLM cost per generation isn't a priority at {{company}} right now — I'll check back. If it is: reply "yes" and I'll set up the access. Free plan, 5 minutes.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Last message. If LLM cost per generation isn't a priority at {{company}} right now — I'll check back. If it is: reply "yes" and I'll set up the access. Free plan, 5 minutes.

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
    subject: "{{company}} — LLM cost on long audio",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Long audio transcriptions generate very large context windows when passed to the LLM — a 1-hour meeting can easily hit 50–80K tokens per summary. That's where the cost concentrates at {{company}}.</p>
<p>GateCtr compresses that context before it hits the model. Teams doing similar long-form audio workloads cut token usage 35–40% without affecting output quality. One endpoint swap.</p>
<p>Can I set up a free account so you can test it on real {{company}} transcriptions this week?</p>
<p>Yes or no works.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Long audio transcriptions generate very large context windows when passed to the LLM — a 1-hour meeting can easily hit 50–80K tokens per summary. That's where the cost concentrates at {{company}}.

GateCtr compresses that context before it hits the model. Teams doing similar long-form audio workloads cut token usage 35–40% without affecting output quality. One endpoint swap.

Can I set up a free account so you can test it on real {{company}} transcriptions this week?

Yes or no works.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },

  {
    step: 2,
    category: "voice-ai",
    name: "Voice-AI — Follow-up",
    subject: "Re: {{company}} — LLM cost on long audio",
    bodyHtml: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;color:#1a1a1a;line-height:1.6;">
<p>Hi {{firstName}},</p>
<p>Following up. GateCtr also lets you set a hard budget cap per client or per session — so if a {{company}} customer runs an unusually long session, it doesn't blow the monthly budget. The cap blocks before the LLM call, not after.</p>
<p>Do you want me to open the access?</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Following up. GateCtr also lets you set a hard budget cap per client or per session — so if a {{company}} customer runs an unusually long session, it doesn't blow the monthly budget. The cap blocks before the LLM call, not after.

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
<p>Last message. If LLM cost on long audio isn't a priority at {{company}} right now — I'll check back. If it is: reply "yes" and I'll set up the access. Free plan, 5 minutes.</p>
${closing("{{senderName}}")}
</div>`,
    bodyText: `Hi {{firstName}},

Last message. If LLM cost on long audio isn't a priority at {{company}} right now — I'll check back. If it is: reply "yes" and I'll set up the access. Free plan, 5 minutes.

${closingText("{{senderName}}")}`,
    variables: ["firstName", "lastName", "company", "jobTitle", "senderName"],
  },
];
