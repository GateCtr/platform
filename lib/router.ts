import type { GatewayRequest } from "@/lib/llm/types";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export interface RouteResult {
  model: string;
  routed: boolean;
  scoringDurationMs: number;
}

type Complexity = "low" | "medium" | "high";

// ── Semantic complexity classification ───────────────────────────────────────
// Pattern-based heuristics — no external LLM call needed.
// High signals: reasoning, code, math, analysis tasks → premium model
// Low signals: factual lookups, yes/no, simple definitions → cheap model
// Falls back to char count when signals are ambiguous.

const HIGH_COMPLEXITY_SIGNALS = [
  /\b(reason|analyze|analyse|compare|evaluate|critique|debate|assess)\b/i,
  /\b(step[- ]by[- ]step|chain of thought|think through|walk me through)\b/i,
  /\b(code|function|algorithm|implement|refactor|debug|architecture)\b/i,
  /\b(math|equation|proof|calculate|formula|derive|integral)\b/i,
  /\b(summarize|summarise|explain in detail|in depth|comprehensive)\b/i,
  /\b(write a|generate a|create a|build a|design a)\b/i,
  /\b(pros and cons|tradeoffs|trade-offs|advantages and disadvantages)\b/i,
];

const LOW_COMPLEXITY_SIGNALS = [
  /\b(yes or no|true or false|is it|does it|can it|will it)\b/i,
  /\b(what is|what are|define|definition of|meaning of)\b/i,
  /\b(list the|name the|how many|when was|who is|where is)\b/i,
  /\b(translate this word|spell|format this|convert this)\b/i,
  /\b(fix this typo|correct this|is this correct)\b/i,
];

export function classifyComplexity(request: GatewayRequest): Complexity {
  const text = [
    request.prompt ?? "",
    ...(request.messages ?? []).map((m) => m.content),
  ].join(" ");

  const charCount = text.length;
  const lower = text.toLowerCase();

  const highScore = HIGH_COMPLEXITY_SIGNALS.filter((p) => p.test(lower)).length;
  const lowScore = LOW_COMPLEXITY_SIGNALS.filter((p) => p.test(lower)).length;

  // Strong high signal or long request → high complexity
  if (highScore >= 2 || charCount > 2000) return "high";
  // Clear low signal + short request → low complexity
  if (lowScore >= 1 && highScore === 0 && charCount < 400) return "low";
  // Char-count fallback for ambiguous cases
  if (charCount < 200) return "low";
  return "medium";
}

// ── Scoring ───────────────────────────────────────────────────────────────────

interface Candidate {
  modelId: string;
  inputCostPer1kTokens: number;
  avgLatencyMs: number;
  contextWindow: number;
}

function complexityMatch(candidate: Candidate, complexity: Complexity): number {
  if (complexity === "low") {
    return candidate.inputCostPer1kTokens < 0.01 &&
      (candidate.avgLatencyMs ?? 1000) < 1000
      ? 1
      : 0;
  }
  if (complexity === "high") {
    return candidate.contextWindow > 32000 &&
      candidate.inputCostPer1kTokens < 0.05
      ? 1
      : 0;
  }
  return 0.5; // medium — neutral
}

function scoreCandidate(
  candidate: Candidate,
  minCost: number,
  maxCost: number,
  minLatency: number,
  maxLatency: number,
  complexity: Complexity,
): number {
  const costRange = maxCost - minCost || 1;
  const latencyRange = maxLatency - minLatency || 1;
  const normalizedCost = (candidate.inputCostPer1kTokens - minCost) / costRange;
  const normalizedLatency =
    ((candidate.avgLatencyMs ?? 0) - minLatency) / latencyRange;
  const match = complexityMatch(candidate, complexity);
  return 0.6 * normalizedCost + 0.4 * normalizedLatency - match * 0.3;
}

// ── Redis cache helpers ───────────────────────────────────────────────────────

const CATALOG_CACHE_TTL = 300; // 5 minutes

async function getCachedCatalog(userId: string): Promise<Candidate[] | null> {
  try {
    const key = `router:catalog:${userId}`;
    return await redis.get<Candidate[]>(key);
  } catch {
    return null;
  }
}

async function setCachedCatalog(
  userId: string,
  candidates: Candidate[],
): Promise<void> {
  try {
    const key = `router:catalog:${userId}`;
    await redis.setex(key, CATALOG_CACHE_TTL, JSON.stringify(candidates));
  } catch {
    // cache failure is non-fatal
  }
}

// ── Main route() ──────────────────────────────────────────────────────────────

export async function route(
  request: GatewayRequest,
  userId: string,
): Promise<RouteResult> {
  const start = Date.now();

  try {
    const complexity = classifyComplexity(request);

    // Fetch candidates from cache or DB
    let candidates = await getCachedCatalog(userId);

    if (!candidates) {
      // Get providers where user has an active key
      const activeKeys = await prisma.lLMProviderKey.findMany({
        where: { userId, isActive: true },
        select: { provider: true },
      });
      const activeProviders = [...new Set(activeKeys.map((k) => k.provider))];

      if (activeProviders.length === 0) {
        return {
          model: request.model,
          routed: false,
          scoringDurationMs: Date.now() - start,
        };
      }

      const models = await prisma.modelCatalog.findMany({
        where: {
          isActive: true,
          provider: { provider: { in: activeProviders }, isActive: true },
        },
        select: {
          modelId: true,
          inputCostPer1kTokens: true,
          avgLatencyMs: true,
          contextWindow: true,
        },
      });

      candidates = models.map((m) => ({
        modelId: m.modelId,
        inputCostPer1kTokens: m.inputCostPer1kTokens,
        avgLatencyMs: m.avgLatencyMs ?? 1000,
        contextWindow: m.contextWindow,
      }));

      await setCachedCatalog(userId, candidates);
    }

    if (candidates.length === 0) {
      return {
        model: request.model,
        routed: false,
        scoringDurationMs: Date.now() - start,
      };
    }

    // Min-max normalization
    const costs = candidates.map((c) => c.inputCostPer1kTokens);
    const latencies = candidates.map((c) => c.avgLatencyMs);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);

    // Score all candidates
    let bestModel = candidates[0].modelId;
    let bestScore = Infinity;

    for (const candidate of candidates) {
      const score = scoreCandidate(
        candidate,
        minCost,
        maxCost,
        minLatency,
        maxLatency,
        complexity,
      );
      if (score < bestScore) {
        bestScore = score;
        bestModel = candidate.modelId;
      }
    }

    const scoringDurationMs = Date.now() - start;
    const routed = bestModel !== request.model;

    console.debug("[router]", {
      requestedModel: request.model,
      selectedModel: bestModel,
      routed,
      scoringDurationMs,
    });

    return { model: bestModel, routed, scoringDurationMs };
  } catch (err) {
    console.error("[router] unhandled error, returning original model:", err);
    return {
      model: request.model,
      routed: false,
      scoringDurationMs: Date.now() - start,
    };
  }
}
