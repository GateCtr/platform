// ─── LLM Models ──────────────────────────────────────────────────────────────

export type ModelCategory =
  | "frontier"
  | "efficient"
  | "reasoning"
  | "open-source";

export interface LlmModel {
  slug: string;
  name: string;
  provider: string;
  inputPer1M: number;
  outputPer1M: number;
  contextWindow: number;
  speedTokensPerSec: number;
  category: ModelCategory;
}

export const LLM_MODELS: LlmModel[] = [
  {
    slug: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    inputPer1M: 2.5,
    outputPer1M: 10.0,
    contextWindow: 128000,
    speedTokensPerSec: 110,
    category: "frontier",
  },
  {
    slug: "gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "OpenAI",
    inputPer1M: 0.15,
    outputPer1M: 0.6,
    contextWindow: 128000,
    speedTokensPerSec: 180,
    category: "efficient",
  },
  {
    slug: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    inputPer1M: 10.0,
    outputPer1M: 30.0,
    contextWindow: 128000,
    speedTokensPerSec: 60,
    category: "frontier",
  },
  {
    slug: "o1",
    name: "o1",
    provider: "OpenAI",
    inputPer1M: 15.0,
    outputPer1M: 60.0,
    contextWindow: 200000,
    speedTokensPerSec: 40,
    category: "reasoning",
  },
  {
    slug: "o3-mini",
    name: "o3-mini",
    provider: "OpenAI",
    inputPer1M: 1.1,
    outputPer1M: 4.4,
    contextWindow: 200000,
    speedTokensPerSec: 90,
    category: "reasoning",
  },
  {
    slug: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    contextWindow: 200000,
    speedTokensPerSec: 95,
    category: "frontier",
  },
  {
    slug: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    inputPer1M: 0.8,
    outputPer1M: 4.0,
    contextWindow: 200000,
    speedTokensPerSec: 200,
    category: "efficient",
  },
  {
    slug: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    inputPer1M: 15.0,
    outputPer1M: 75.0,
    contextWindow: 200000,
    speedTokensPerSec: 50,
    category: "frontier",
  },
  {
    slug: "gemini-2-0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    inputPer1M: 0.1,
    outputPer1M: 0.4,
    contextWindow: 1000000,
    speedTokensPerSec: 250,
    category: "efficient",
  },
  {
    slug: "gemini-1-5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    inputPer1M: 1.25,
    outputPer1M: 5.0,
    contextWindow: 2000000,
    speedTokensPerSec: 80,
    category: "frontier",
  },
  {
    slug: "gemini-1-5-flash",
    name: "Gemini 1.5 Flash",
    provider: "Google",
    inputPer1M: 0.075,
    outputPer1M: 0.3,
    contextWindow: 1000000,
    speedTokensPerSec: 220,
    category: "efficient",
  },
  {
    slug: "mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    inputPer1M: 2.0,
    outputPer1M: 6.0,
    contextWindow: 128000,
    speedTokensPerSec: 100,
    category: "frontier",
  },
  {
    slug: "mistral-small",
    name: "Mistral Small",
    provider: "Mistral",
    inputPer1M: 0.1,
    outputPer1M: 0.3,
    contextWindow: 32000,
    speedTokensPerSec: 160,
    category: "efficient",
  },
  {
    slug: "llama-3-3-70b",
    name: "Llama 3.3 70B",
    provider: "Meta",
    inputPer1M: 0.23,
    outputPer1M: 0.4,
    contextWindow: 128000,
    speedTokensPerSec: 180,
    category: "open-source",
  },
  {
    slug: "llama-3-1-405b",
    name: "Llama 3.1 405B",
    provider: "Meta",
    inputPer1M: 3.0,
    outputPer1M: 3.0,
    contextWindow: 128000,
    speedTokensPerSec: 60,
    category: "open-source",
  },
];

export const TOP_MODEL_SLUGS = [
  "gpt-4o",
  "gpt-4o-mini",
  "claude-3-5-sonnet",
  "claude-3-5-haiku",
  "o1",
  "o3-mini",
  "gemini-2-0-flash",
  "gemini-1-5-pro",
  "mistral-large",
  "llama-3-3-70b",
];

// ─── Comparisons ──────────────────────────────────────────────────────────────

export const FEATURED_COMPARISONS = [
  "gpt-4o-vs-claude-3-5-sonnet",
  "gpt-4o-mini-vs-claude-3-5-haiku",
  "gpt-4o-vs-gemini-1-5-pro",
  "claude-3-5-sonnet-vs-gemini-1-5-pro",
  "gpt-4o-mini-vs-gemini-2-0-flash",
  "o1-vs-claude-3-opus",
  "mistral-large-vs-gpt-4o",
  "llama-3-3-70b-vs-mistral-large",
  "gpt-4-turbo-vs-gpt-4o",
  "gemini-1-5-flash-vs-gpt-4o-mini",
];

// ─── Integrations ─────────────────────────────────────────────────────────────

export type IntegrationLanguage = "python" | "typescript" | "rest";
export type IntegrationCategory = "sdk" | "framework" | "http";

export interface Integration {
  slug: string;
  name: string;
  language: IntegrationLanguage;
  category: IntegrationCategory;
  description: string;
  beforeCode: string;
  afterCode: string;
  searchVolume: "high" | "medium" | "low";
}

export const INTEGRATIONS: Integration[] = [
  {
    slug: "openai-python-sdk",
    name: "OpenAI Python SDK",
    language: "python",
    category: "sdk",
    description: "Drop-in replacement for the official OpenAI Python client",
    beforeCode: `from openai import OpenAI

client = OpenAI(api_key="sk-...")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)`,
    afterCode: `from openai import OpenAI

client = OpenAI(
    api_key="sk-...",
    base_url="https://api.gatectr.com/v1"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)`,
    searchVolume: "high",
  },
  {
    slug: "openai-node-sdk",
    name: "OpenAI Node.js SDK",
    language: "typescript",
    category: "sdk",
    description: "Drop-in replacement for the official OpenAI Node.js client",
    beforeCode: `import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello" }],
});`,
    afterCode: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.gatectr.com/v1",
});

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello" }],
});`,
    searchVolume: "high",
  },
  {
    slug: "langchain",
    name: "LangChain",
    language: "python",
    category: "framework",
    description: "Route LangChain LLM calls through GateCtr for cost control",
    beforeCode: `from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o", api_key="sk-...")`,
    afterCode: `from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4o",
    api_key="sk-...",
    openai_api_base="https://api.gatectr.com/v1"
)`,
    searchVolume: "high",
  },
  {
    slug: "langchain-js",
    name: "LangChain.js",
    language: "typescript",
    category: "framework",
    description: "Route LangChain.js LLM calls through GateCtr",
    beforeCode: `import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({ model: "gpt-4o" });`,
    afterCode: `import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  model: "gpt-4o",
  configuration: { baseURL: "https://api.gatectr.com/v1" },
});`,
    searchVolume: "medium",
  },
  {
    slug: "llamaindex",
    name: "LlamaIndex",
    language: "python",
    category: "framework",
    description:
      "Add budget control and token optimization to LlamaIndex pipelines",
    beforeCode: `from llama_index.llms.openai import OpenAI

llm = OpenAI(model="gpt-4o", api_key="sk-...")`,
    afterCode: `from llama_index.llms.openai import OpenAI

llm = OpenAI(
    model="gpt-4o",
    api_key="sk-...",
    api_base="https://api.gatectr.com/v1"
)`,
    searchVolume: "medium",
  },
  {
    slug: "vercel-ai-sdk",
    name: "Vercel AI SDK",
    language: "typescript",
    category: "sdk",
    description:
      "Use GateCtr with the Vercel AI SDK via custom provider base URL",
    beforeCode: `import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

const { text } = await generateText({
  model: openai("gpt-4o"),
  prompt: "Hello",
});`,
    afterCode: `import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const gatectr = createOpenAI({
  baseURL: "https://api.gatectr.com/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

const { text } = await generateText({
  model: gatectr("gpt-4o"),
  prompt: "Hello",
});`,
    searchVolume: "high",
  },
  {
    slug: "litellm",
    name: "LiteLLM",
    language: "python",
    category: "framework",
    description:
      "Proxy LiteLLM calls through GateCtr for unified cost tracking",
    beforeCode: `import litellm

response = litellm.completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)`,
    afterCode: `import litellm

response = litellm.completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
    api_base="https://api.gatectr.com/v1"
)`,
    searchVolume: "medium",
  },
  {
    slug: "instructor",
    name: "Instructor",
    language: "python",
    category: "framework",
    description:
      "Structured outputs via Instructor with GateCtr cost optimization",
    beforeCode: `import instructor
from openai import OpenAI

client = instructor.from_openai(OpenAI(api_key="sk-..."))`,
    afterCode: `import instructor
from openai import OpenAI

client = instructor.from_openai(
    OpenAI(api_key="sk-...", base_url="https://api.gatectr.com/v1")
)`,
    searchVolume: "medium",
  },
  {
    slug: "axios",
    name: "Axios / fetch (REST)",
    language: "rest",
    category: "http",
    description:
      "Direct REST API calls with GateCtr as a drop-in base URL replacement",
    beforeCode: `const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.OPENAI_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ model: "gpt-4o", messages }),
});`,
    afterCode: `const response = await fetch("https://api.gatectr.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.OPENAI_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ model: "gpt-4o", messages }),
});`,
    searchVolume: "medium",
  },
];

// ─── Glossary ─────────────────────────────────────────────────────────────────

export interface GlossaryTerm {
  slug: string;
  name: string;
  shortDefinition: string;
  body: string;
  relatedTerms: string[];
  relatedModels: string[];
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    slug: "token-optimization",
    name: "Token Optimization",
    shortDefinition:
      "The process of reducing the number of tokens sent to an LLM without degrading output quality.",
    body: `<p>Token optimization refers to techniques that reduce the total number of tokens consumed during an LLM API call. Since most LLM providers charge per token (input and output separately), reducing token count directly reduces cost.</p><p>Common token optimization strategies include prompt compression (removing redundant context), conversation history trimming (keeping only the most relevant turns), and semantic deduplication (removing repeated information). Advanced systems like GateCtr apply these automatically before the request reaches the LLM provider.</p><p>A well-optimized prompt can reduce token usage by 20–40% while maintaining output quality. At scale — 10M tokens/month — this translates to hundreds of dollars in monthly savings.</p>`,
    relatedTerms: [
      "prompt-compression",
      "token-counting",
      "llm-cost-reduction",
    ],
    relatedModels: ["gpt-4o", "claude-3-5-sonnet"],
  },
  {
    slug: "prompt-compression",
    name: "Prompt Compression",
    shortDefinition:
      "A technique that shortens prompts by removing redundant tokens while preserving semantic meaning.",
    body: `<p>Prompt compression is the automated process of reducing the length of a prompt before it is sent to an LLM. Unlike simple truncation, compression preserves the semantic content — the model receives the same information in fewer tokens.</p><p>Techniques include removing filler words, condensing verbose instructions, summarizing long context windows, and eliminating duplicate information. GateCtr applies prompt compression transparently on every API call, with an average reduction of up to 40%.</p><p>The key metric is the compression ratio: a ratio of 0.6 means the compressed prompt is 60% of the original size. GateCtr returns this metric in every response so you can measure savings per request.</p>`,
    relatedTerms: ["token-optimization", "context-window", "token-counting"],
    relatedModels: ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet"],
  },
  {
    slug: "llm-routing",
    name: "LLM Routing",
    shortDefinition:
      "Automatically selecting the most cost-effective LLM for each request based on complexity and requirements.",
    body: `<p>LLM routing is the practice of dynamically selecting which language model handles a given request. Rather than sending all requests to a single model, a router evaluates each request and assigns it to the most appropriate model based on criteria like complexity, required quality, latency constraints, and cost.</p><p>A simple Q&A query might be routed to a fast, cheap model like GPT-4o mini, while a complex reasoning task is sent to GPT-4o or Claude 3.5 Sonnet. This approach can reduce average cost per request by 30–60% without sacrificing quality on tasks that require it.</p><p>GateCtr's Model Router uses semantic complexity scoring to make routing decisions automatically. Pass <code>model: "auto"</code> and GateCtr handles the rest.</p>`,
    relatedTerms: [
      "inference-cost",
      "latency-vs-cost-tradeoff",
      "model-fallback",
    ],
    relatedModels: [
      "gpt-4o",
      "gpt-4o-mini",
      "claude-3-5-haiku",
      "mistral-small",
    ],
  },
  {
    slug: "context-window",
    name: "Context Window",
    shortDefinition:
      "The maximum number of tokens an LLM can process in a single request, including both input and output.",
    body: `<p>The context window defines the maximum amount of text (measured in tokens) that a language model can consider at once. It includes the system prompt, conversation history, user input, and the model's output. Exceeding the context window causes the model to truncate or reject the request.</p><p>Context windows vary significantly across models: GPT-4o supports 128K tokens, Claude 3.5 Sonnet supports 200K, and Gemini 1.5 Pro supports up to 2M tokens. Larger context windows enable longer conversations and document analysis but also increase cost.</p><p>Efficient context management — keeping only relevant history, summarizing old turns — is a key part of token optimization. GateCtr's Context Optimizer automatically trims and compresses context to stay within efficient token ranges.</p>`,
    relatedTerms: [
      "token-counting",
      "prompt-compression",
      "token-optimization",
    ],
    relatedModels: ["gemini-1-5-pro", "claude-3-5-sonnet", "o1"],
  },
  {
    slug: "llm-cost-reduction",
    name: "LLM Cost Reduction",
    shortDefinition:
      "Strategies and tools that reduce the total spend on LLM API calls without degrading application quality.",
    body: `<p>LLM cost reduction encompasses all techniques used to lower the financial cost of running AI-powered applications. As LLM usage scales, costs can grow rapidly — a 10x increase in users often means a 10x increase in API spend.</p><p>The main levers are: (1) token optimization — sending fewer tokens per request; (2) model routing — using cheaper models for simpler tasks; (3) caching — reusing responses for identical or semantically similar requests; (4) budget enforcement — hard caps that prevent runaway costs.</p><p>GateCtr combines all four approaches in a single endpoint swap. Teams typically see 30–40% cost reduction from token optimization alone, with additional savings from intelligent routing.</p>`,
    relatedTerms: [
      "token-optimization",
      "llm-routing",
      "budget-cap",
      "prompt-caching",
    ],
    relatedModels: [
      "gpt-4o-mini",
      "claude-3-5-haiku",
      "gemini-2-0-flash",
      "mistral-small",
    ],
  },
  {
    slug: "model-fallback",
    name: "Model Fallback",
    shortDefinition:
      "Automatically switching to an alternative LLM when the primary model is unavailable or over budget.",
    body: `<p>Model fallback is a resilience pattern where an application automatically switches to a secondary LLM when the primary model fails, is rate-limited, or exceeds a budget threshold. Without fallback, a single provider outage can take down an entire AI-powered application.</p><p>Fallback strategies range from simple (try provider A, then provider B) to sophisticated (route to the cheapest available model that meets quality requirements). GateCtr supports configurable fallback chains — define your preferred model order and GateCtr handles the switching transparently.</p><p>Fallback also applies to budget scenarios: when a project hits its token cap, GateCtr can either block the request (hard stop) or route to a cheaper model (soft fallback), depending on your configuration.</p>`,
    relatedTerms: ["llm-routing", "budget-cap", "rate-limiting-llm"],
    relatedModels: ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet"],
  },
  {
    slug: "budget-cap",
    name: "Budget Cap",
    shortDefinition:
      "A hard limit on token or dollar spend that blocks LLM requests once the threshold is reached.",
    body: `<p>A budget cap is a hard constraint that prevents an application from exceeding a defined spending limit on LLM API calls. Unlike soft alerts (which notify you after the fact), a budget cap actively blocks requests once the limit is hit — ensuring zero overage.</p><p>Budget caps can be set per project, per user, per API key, or globally. They can be defined in tokens (e.g., 1M tokens/month) or in dollars (e.g., $50/month). When the cap is reached, the LLM request is blocked before it reaches the provider — no tokens are consumed, no cost is incurred.</p><p>GateCtr's Budget Firewall implements hard caps with configurable soft alerts (e.g., notify at 80% usage). This is the primary feature on the Free plan and the most direct way to eliminate surprise invoices.</p>`,
    relatedTerms: ["llm-cost-reduction", "rate-limiting-llm", "model-fallback"],
    relatedModels: [],
  },
  {
    slug: "token-counting",
    name: "Token Counting",
    shortDefinition:
      "The process of measuring how many tokens a text string will consume when sent to an LLM.",
    body: `<p>Token counting is the process of calculating how many tokens a given text will use when processed by a specific LLM. Token counts are not equivalent to word counts — a token is roughly 4 characters in English, but varies by language and model.</p><p>Accurate token counting is essential for cost estimation, context window management, and budget enforcement. Each model uses its own tokenizer (GPT models use tiktoken, Claude uses a different scheme), so counts can differ for the same text.</p><p>GateCtr counts tokens before and after compression, reporting both the original count and the compressed count in every API response. This gives you precise visibility into savings per request.</p>`,
    relatedTerms: [
      "context-window",
      "prompt-compression",
      "token-optimization",
    ],
    relatedModels: ["gpt-4o", "claude-3-5-sonnet", "gemini-1-5-pro"],
  },
  {
    slug: "llm-gateway",
    name: "LLM Gateway",
    shortDefinition:
      "A proxy layer between your application and LLM providers that adds routing, caching, and cost controls.",
    body: `<p>An LLM gateway is a middleware layer that sits between your application and one or more LLM providers. It intercepts API calls, applies transformations (compression, routing, caching), enforces policies (rate limits, budget caps), and logs usage data.</p><p>The key benefit of a gateway is that it decouples your application from specific LLM providers. You point your code at the gateway endpoint instead of directly at OpenAI or Anthropic — the gateway handles provider selection, failover, and optimization transparently.</p><p>GateCtr is an AI Cost Infrastructure layer — a gateway focused specifically on cost reduction. It combines prompt compression, intelligent routing, and hard budget enforcement in a single endpoint swap with no code changes required.</p>`,
    relatedTerms: ["llm-routing", "llm-observability", "rate-limiting-llm"],
    relatedModels: [],
  },
  {
    slug: "inference-cost",
    name: "Inference Cost",
    shortDefinition:
      "The per-request cost of running a prompt through an LLM, calculated from input and output token counts.",
    body: `<p>Inference cost is the dollar amount charged by an LLM provider for processing a single API request. It is calculated as: <code>(input_tokens × input_price_per_1M) + (output_tokens × output_price_per_1M)</code>.</p><p>Inference costs vary dramatically across models. GPT-4o costs $2.50/1M input tokens while GPT-4o mini costs $0.15/1M — a 16x difference. Choosing the right model for each task is one of the most impactful cost levers available.</p><p>GateCtr reports the exact inference cost for every request in the response metadata, enabling precise cost attribution per project, user, and model. This data feeds the analytics dashboard and budget enforcement system.</p>`,
    relatedTerms: ["token-counting", "llm-cost-reduction", "llm-routing"],
    relatedModels: [
      "gpt-4o",
      "gpt-4o-mini",
      "claude-3-5-sonnet",
      "gemini-2-0-flash",
    ],
  },
  {
    slug: "prompt-caching",
    name: "Prompt Caching",
    shortDefinition:
      "Storing LLM responses for reuse when identical or similar prompts are submitted again.",
    body: `<p>Prompt caching stores the output of an LLM call and returns the cached response when the same (or semantically similar) prompt is submitted again. For applications with repetitive queries — FAQ bots, document Q&A, code assistants — caching can eliminate 30–70% of API calls entirely.</p><p>There are two types: exact caching (same prompt → same response) and semantic caching (similar prompts → reuse response if similarity exceeds a threshold). Semantic caching requires embedding the prompt and comparing against a vector store.</p><p>GateCtr's LLM Cache Layer (coming Q1 2027) will implement semantic caching transparently. Until then, GateCtr's token compression reduces the cost of cache misses.</p>`,
    relatedTerms: [
      "semantic-caching",
      "llm-cost-reduction",
      "token-optimization",
    ],
    relatedModels: [],
  },
  {
    slug: "semantic-caching",
    name: "Semantic Caching",
    shortDefinition:
      "A caching strategy that reuses LLM responses for prompts that are semantically similar, not just identical.",
    body: `<p>Semantic caching extends traditional exact-match caching by using vector embeddings to identify prompts that are semantically equivalent even if worded differently. "What is the capital of France?" and "Tell me the capital city of France" would both hit the same cache entry.</p><p>The process: embed the incoming prompt → search a vector store for similar cached prompts → if similarity exceeds a threshold (e.g., 0.95 cosine similarity), return the cached response without calling the LLM.</p><p>Semantic caching is particularly effective for customer-facing applications where users ask similar questions repeatedly. It can reduce LLM API calls by 40–70% for high-traffic use cases. GateCtr's roadmap includes a semantic cache layer in Q1 2027.</p>`,
    relatedTerms: [
      "prompt-caching",
      "llm-cost-reduction",
      "token-optimization",
    ],
    relatedModels: [],
  },
  {
    slug: "latency-vs-cost-tradeoff",
    name: "Latency vs. Cost Tradeoff",
    shortDefinition:
      "The balance between response speed and API cost when selecting an LLM for a given task.",
    body: `<p>Every LLM presents a tradeoff between latency (how fast it responds) and cost (how much it charges per token). Frontier models like GPT-4o and Claude 3.5 Sonnet are more capable but slower and more expensive. Efficient models like GPT-4o mini and Gemini 2.0 Flash are faster and cheaper but may produce lower-quality outputs on complex tasks.</p><p>The optimal choice depends on the use case: a real-time chat interface prioritizes latency, while a batch document processing pipeline can tolerate higher latency for lower cost. Reasoning models like o1 have very high latency but excel at complex multi-step problems.</p><p>GateCtr's Model Router evaluates both dimensions automatically — scoring each request for complexity and routing to the model that minimizes cost while meeting latency requirements.</p>`,
    relatedTerms: ["llm-routing", "inference-cost", "model-fallback"],
    relatedModels: ["gpt-4o", "gpt-4o-mini", "o1", "gemini-2-0-flash"],
  },
  {
    slug: "llm-observability",
    name: "LLM Observability",
    shortDefinition:
      "The ability to monitor, trace, and analyze LLM API calls including tokens, costs, latency, and errors.",
    body: `<p>LLM observability refers to the tooling and practices that give you visibility into how your AI application is behaving in production. It covers token usage per request, cost attribution, latency distribution, error rates, and model performance over time.</p><p>Without observability, it is impossible to know which part of your application is driving costs, which prompts are failing, or whether a model change improved or degraded quality. Observability is the foundation for cost optimization — you cannot reduce what you cannot measure.</p><p>GateCtr provides built-in observability for every API call: tokens in/out, cost in USD, model used, latency, compression ratio, and routing decision. All data is available in real-time in the dashboard and queryable via the REST API.</p>`,
    relatedTerms: ["inference-cost", "token-counting", "llm-gateway"],
    relatedModels: [],
  },
  {
    slug: "rate-limiting-llm",
    name: "Rate Limiting (LLM)",
    shortDefinition:
      "Controlling the frequency of LLM API calls to prevent abuse, manage costs, and stay within provider limits.",
    body: `<p>Rate limiting in the context of LLMs means restricting how many API calls can be made within a given time window. This serves two purposes: staying within provider-imposed rate limits (requests per minute, tokens per minute) and enforcing application-level policies (per-user limits, per-project caps).</p><p>Provider rate limits are hard constraints — exceeding them results in HTTP 429 errors. Application-level rate limits are policy decisions — you might limit a free-tier user to 100 requests/day to control costs.</p><p>GateCtr enforces both types of rate limits. Budget caps act as token-based rate limits, while the Budget Firewall blocks requests that would exceed defined thresholds. This prevents both provider errors and unexpected cost spikes.</p>`,
    relatedTerms: ["budget-cap", "model-fallback", "llm-gateway"],
    relatedModels: [],
  },
];
