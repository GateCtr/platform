import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { optimize, countTokens } from "@/lib/optimizer";
import { classifyComplexity } from "@/lib/router";
import { complete as openaiComplete } from "@/lib/llm/openai";
import { complete as geminiComplete } from "@/lib/llm/gemini";
import type { GatewayRequest } from "@/lib/llm/types";
import { ProviderError } from "@/lib/llm/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const SANDBOX_QUOTA = 3;
const USER_KEY_QUOTA = 10;
const SESSION_TTL = 60 * 60 * 1000;
const SANDBOX_MAX_PROMPT = 500;
const SANDBOX_MODEL = "gpt-5.4-nano"; // cheapest current OpenAI model for sandbox
const REQUEST_TIMEOUT = 15_000;

const COST_PER_1K: Record<string, number> = {
  // OpenAI — current as of March 2026
  "gpt-5.4": 0.015,
  "gpt-5.4-mini": 0.0004,
  "gpt-5.4-nano": 0.0001,
  "gpt-4.1": 0.002,
  "gpt-4o": 0.005,
  // Gemini — current as of March 2026
  "gemini-2.5-pro": 0.00125,
  "gemini-2.5-flash": 0.000075,
};
const DEFAULT_COST_PER_1K = 0.005;

// ── Provider detection ────────────────────────────────────────────────────────

type Provider = "openai" | "gemini";

function detectProvider(apiKey: string, model: string): Provider {
  if (apiKey.startsWith("AIza")) return "gemini";
  if (model.startsWith("gemini-")) return "gemini";
  return "openai";
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

const ipStore = new Map<string, { count: number; resetAt: number }>();

function checkLimit(ip: string, quota: number): { allowed: boolean; remaining: number } {
  // Always bypass in development
  if (process.env.NODE_ENV === "development") {
    return { allowed: true, remaining: quota };
  }
  const now = Date.now();
  const entry = ipStore.get(ip);
  if (!entry || now > entry.resetAt) {
    ipStore.set(ip, { count: 1, resetAt: now + SESSION_TTL });
    return { allowed: true, remaining: quota - 1 };
  }
  if (entry.count >= quota) return { allowed: false, remaining: 0 };
  entry.count += 1;
  return { allowed: true, remaining: quota - entry.count };
}

// ── Key validation ────────────────────────────────────────────────────────────

function isValidApiKey(key: string): boolean {
  return /^sk-[A-Za-z0-9_-]{20,}$/.test(key) || /^AIza[A-Za-z0-9_-]{35,}$/.test(key);
}

// ── Cost helpers ──────────────────────────────────────────────────────────────

function estimateCost(tokens: number, model: string): number {
  return (tokens / 1000) * (COST_PER_1K[model] ?? DEFAULT_COST_PER_1K);
}

// ── Demo routing (no DB) ──────────────────────────────────────────────────────

function routeForDemo(
  request: GatewayRequest,
  requestedModel: string,
  provider: Provider,
): { model: string; routingReason: string } {
  if (requestedModel !== "auto") {
    return { model: requestedModel, routingReason: "user_specified" };
  }
  const complexity = classifyComplexity(request);
  if (provider === "gemini") {
    return complexity === "high"
      ? { model: "gemini-2.5-pro", routingReason: "high_complexity" }
      : { model: "gemini-2.5-flash", routingReason: complexity === "low" ? "low_complexity" : "medium_complexity" };
  }
  // OpenAI
  return complexity === "low"
    ? { model: "gpt-5.4-nano", routingReason: "low_complexity" }
    : complexity === "high"
      ? { model: "gpt-5.4", routingReason: "high_complexity" }
      : { model: "gpt-5.4-mini", routingReason: "medium_complexity" };
}

// ── POST /api/demo ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // ── Parse body ───────────────────────────────────────────────────────────────
  let body: { prompt?: string; model?: string; apiKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const rawPrompt = body.prompt?.trim() ?? "";
  const requestedModel = body.model ?? "auto";
  const userApiKey = body.apiKey?.trim() ?? "";
  const isSandbox = !userApiKey;

  // ── Validate prompt ──────────────────────────────────────────────────────────
  if (rawPrompt.length < 5) {
    return NextResponse.json({ error: "prompt_too_short" }, { status: 400 });
  }
  if (rawPrompt.length > 2000) {
    return NextResponse.json({ error: "prompt_too_long" }, { status: 400 });
  }

  // ── Validate user key if provided ────────────────────────────────────────────
  if (!isSandbox && !isValidApiKey(userApiKey)) {
    return NextResponse.json({ error: "invalid_api_key" }, { status: 400 });
  }

  // ── Rate limit ───────────────────────────────────────────────────────────────
  const quota = isSandbox ? SANDBOX_QUOTA : USER_KEY_QUOTA;
  const limit = checkLimit(ip, quota);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "demo_quota_exceeded",
        sandbox: isSandbox,
        message: isSandbox
          ? "Sandbox limit reached (3 req/hour). Provide your API key for 10 req/hour, or sign up."
          : "Demo limit reached (10 req/hour). Sign up for unlimited access.",
      },
      { status: 429 },
    );
  }

  // ── Sandbox: truncate prompt to keep costs bounded ───────────────────────────
  const prompt = isSandbox
    ? rawPrompt.slice(0, SANDBOX_MAX_PROMPT)
    : rawPrompt;

  // ── Resolve API key + provider ───────────────────────────────────────────────
  const apiKey = isSandbox
    ? (process.env.DEMO_SANDBOX_OPENAI_KEY ?? "")
    : userApiKey;

  if (!apiKey) {
    return NextResponse.json(
      { error: "sandbox_unavailable", message: "Sandbox is not configured." },
      { status: 503 },
    );
  }

  const provider: Provider = isSandbox ? "openai" : detectProvider(apiKey, requestedModel);

  // ── Build gateway request ────────────────────────────────────────────────────
  const baseModel = isSandbox
    ? SANDBOX_MODEL
    : requestedModel === "auto"
      ? (provider === "gemini" ? "gemini-2.5-flash" : "gpt-5.4-mini")
      : requestedModel;

  const gatewayReq: GatewayRequest = {
    model: baseModel,
    messages: [{ role: "user", content: prompt }],
    maxTokens: 256,
    temperature: 0.7,
  };

  // ── Optimize ─────────────────────────────────────────────────────────────────
  const originalTokens = countTokens(prompt, gatewayReq.model);
  let optimizeResult;
  try {
    optimizeResult = await optimize(gatewayReq);
  } catch {
    optimizeResult = {
      request: gatewayReq,
      savedTokens: 0,
      originalTokens,
      optimizedTokens: originalTokens,
      techniques: [],
      durationMs: 0,
    };
  }

  const optimizedReq = optimizeResult.request;
  const optimizedPrompt =
    optimizedReq.messages?.[0]?.content ?? optimizedReq.prompt ?? prompt;
  const optimizedTokens = optimizeResult.optimizedTokens;
  const savedTokens = optimizeResult.savedTokens;
  const compressionRatio =
    originalTokens > 0
      ? Math.round((savedTokens / originalTokens) * 100)
      : 0;

  // ── Route (sandbox always uses SANDBOX_MODEL, skip routing) ──────────────────
  const { model: routedModel, routingReason } = isSandbox
    ? { model: SANDBOX_MODEL, routingReason: "sandbox_fixed" }
    : routeForDemo({ ...optimizedReq, model: requestedModel }, requestedModel, provider);

  const finalReq: GatewayRequest = {
    ...optimizedReq,
    model: routedModel,
  };

  // ── Real LLM call ─────────────────────────────────────────────────────────────
  const callStart = Date.now();
  let llmResponse;
  const callFn = provider === "gemini" ? geminiComplete : openaiComplete;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), REQUEST_TIMEOUT),
    );
    llmResponse = await Promise.race([callFn(finalReq, apiKey), timeoutPromise]);
  } catch (err) {
    if (err instanceof ProviderError) {
      const status = err.status === 401 ? 401 : err.status === 429 ? 429 : 502;
      const providerName = provider === "gemini" ? "Gemini" : "OpenAI";
      return NextResponse.json(
        {
          error: "provider_error",
          message:
            err.status === 401
              ? `Invalid API key. Check your ${providerName} key and try again.`
              : err.status === 429
                ? `${providerName} rate limit reached. Try again in a moment.`
                : "LLM provider error. Try again.",
        },
        { status },
      );
    }
    if (err instanceof Error && err.message === "timeout") {
      return NextResponse.json(
        { error: "timeout", message: "Request timed out. Try a shorter prompt." },
        { status: 504 },
      );
    }
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }

  const latencyMs = Date.now() - callStart;

  // ── Cost calculation ──────────────────────────────────────────────────────────
  const realPromptTokens = llmResponse.promptTokens || optimizedTokens;
  const realCompletionTokens = llmResponse.completionTokens;
  const costUsd = estimateCost(realPromptTokens, routedModel) +
    estimateCost(realCompletionTokens, routedModel) * 2;
  const costSavedUsd = estimateCost(savedTokens, routedModel);

  return NextResponse.json(
    {
      // Response
      content: llmResponse.content,
      model_used: llmResponse.model || routedModel,
      routing_reason: routingReason,
      sandbox: isSandbox,

      // Token breakdown
      tokens: {
        original: originalTokens,
        optimized: optimizedTokens,
        saved: savedTokens,
        completion: realCompletionTokens,
        total: realPromptTokens + realCompletionTokens,
      },

      // Compression
      compression_ratio: compressionRatio,
      optimized_prompt: optimizedPrompt,
      techniques: optimizeResult.techniques,

      // Cost
      cost_usd: parseFloat(costUsd.toFixed(6)),
      cost_saved_usd: parseFloat(costSavedUsd.toFixed(6)),

      // Meta
      latency_ms: latencyMs,
      remaining_requests: limit.remaining,
    },
    {
      headers: { "X-Demo-Remaining": String(limit.remaining) },
    },
  );
}
