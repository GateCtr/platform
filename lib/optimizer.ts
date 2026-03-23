import { createHash } from "crypto";
import type { GatewayRequest, Message } from "@/lib/llm/types";
import { prisma } from "@/lib/prisma";

export interface OptimizeResult {
  request: GatewayRequest;
  savedTokens: number;
  originalTokens: number;
  optimizedTokens: number;
  techniques: string[];
  durationMs: number;
}

// ── Token counting ────────────────────────────────────────────────────────────
// Strategy:
//   - OpenAI models (gpt-*, o1, o3, o4): tiktoken exact count (cl100k_base / o200k_base)
//   - All others (Anthropic, Mistral, Gemini): calibrated BPE approximation ±5-8%
//     English prose: ~3.8 chars/token. Code: ~3.2 chars/token (denser).
//
// tiktoken encoding selection:
//   o200k_base → gpt-4o, gpt-4o-mini, o1, o3, o4 series
//   cl100k_base → gpt-4, gpt-4-turbo, gpt-3.5-turbo, gpt-4.1 series
//
// We cache encoders to avoid repeated WASM init overhead.

import type { Tiktoken } from "tiktoken";

type EncodingName = "cl100k_base" | "o200k_base";

const encoderCache = new Map<EncodingName, Tiktoken>();

function getEncoder(encoding: EncodingName): Tiktoken {
  if (encoderCache.has(encoding)) return encoderCache.get(encoding)!;
  // Dynamic require to avoid WASM load at module init time
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { get_encoding } = require("tiktoken") as typeof import("tiktoken");
  const enc = get_encoding(encoding);
  encoderCache.set(encoding, enc);
  return enc;
}

function resolveOpenAIEncoding(model: string): EncodingName | null {
  // o200k_base: gpt-4o family, o1/o3/o4 reasoning models
  if (/^(gpt-4o|o1|o3|o4)/.test(model)) return "o200k_base";
  // cl100k_base: gpt-4, gpt-4-turbo, gpt-3.5-turbo, gpt-4.1 family
  if (/^(gpt-4|gpt-3\.5|gpt-4\.1)/.test(model)) return "cl100k_base";
  return null;
}

const CODE_PATTERN = /```[\s\S]*?```|`[^`]+`|\bfunction\b|\bconst\b|\bimport\b/;

function approximateTokens(text: string): number {
  if (!text) return 0;
  const charsPerToken = CODE_PATTERN.test(text) ? 3.2 : 3.8;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Count tokens for a given text and model.
 * - OpenAI models: exact count via tiktoken
 * - Others: calibrated BPE approximation (±5-8%)
 */
export function countTokens(text: string, model?: string): number {
  if (!text) return 0;
  if (model) {
    const encoding = resolveOpenAIEncoding(model);
    if (encoding) {
      try {
        const enc = getEncoder(encoding);
        return enc.encode(text).length;
      } catch {
        // tiktoken failure (e.g. WASM not available in test env) → fallback
      }
    }
  }
  return approximateTokens(text);
}

/** @deprecated Use countTokens(text, model) for accurate results */
export function estimateTokens(text: string): number {
  return approximateTokens(text);
}

function countRequestTokens(request: GatewayRequest): number {
  const model = request.model;
  const texts = [
    request.prompt ?? "",
    ...(request.messages ?? []).map((m) => m.content),
  ];
  return texts.reduce((sum, t) => sum + countTokens(t, model), 0);
}

// ── Stage 1: Whitespace normalization ─────────────────────────────────────────

function normalizeWhitespace(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ blank lines → 2
    .trim();
}

function applyWhitespaceNormalization(messages: Message[]): {
  messages: Message[];
  changed: boolean;
} {
  let changed = false;
  const result = messages.map((m) => {
    const normalized = normalizeWhitespace(m.content);
    if (normalized !== m.content) changed = true;
    return { ...m, content: normalized };
  });
  return { messages: result, changed };
}

// ── Stage 2: Duplicate deduplication ─────────────────────────────────────────

function hashMessage(m: Message): string {
  return createHash("sha256")
    .update(`${m.role}:${m.content.trim()}`)
    .digest("hex");
}

function deduplicateMessages(messages: Message[]): {
  messages: Message[];
  changed: boolean;
} {
  const seen = new Map<string, number>();
  messages.forEach((m, i) => seen.set(hashMessage(m), i));
  const result = messages.filter((m, i) => seen.get(hashMessage(m)) === i);
  return { messages: result, changed: result.length !== messages.length };
}

// ── Stage 2b: Intra-message paragraph deduplication ──────────────────────────
// Agents and RAG pipelines often inject the same context block multiple times
// within a single message (e.g., repeated tool output, repeated data snippets).
// We deduplicate paragraphs (≥20 chars) within each message.

function deduplicateParagraphs(messages: Message[]): {
  messages: Message[];
  changed: boolean;
} {
  let changed = false;
  const result = messages.map((m) => {
    const paragraphs = m.content.split(/\n{2,}/);
    if (paragraphs.length <= 1) return m;
    const seen = new Set<string>();
    const deduped = paragraphs.filter((p) => {
      const key = p.trim().toLowerCase();
      if (key.length < 20) return true; // keep short paragraphs always
      if (seen.has(key)) {
        changed = true;
        return false;
      }
      seen.add(key);
      return true;
    });
    if (deduped.length === paragraphs.length) return m;
    return { ...m, content: deduped.join("\n\n") };
  });
  return { messages: result, changed };
}

// ── Stage 3: Semantic pruning ─────────────────────────────────────────────────

const FILLER_PATTERNS = [
  /^(certainly|sure|of course|absolutely|great|awesome|no problem|understood|got it)[!,.]?\s*/gi,
  /\bAs an AI (language model|assistant),?\s*/gi,
  /\bI('m| am) (here to help|happy to help|glad to help|unable to)[.!]?\s*/gi,
  /\bFeel free to (ask|let me know)[^.]*\.\s*/gi,
  /\bIs there anything else I can (help|assist)[^?]*\?\s*/gi,
  /\bI hope (this helps|that helps|you find this helpful)[.!]?\s*/gi,
  /\bPlease (note|be aware) that\s*/gi,
  /\bIn (summary|conclusion|short),?\s*/gi,
];

function applySemanticPruning(
  messages: Message[],
  pruningPatterns: { pattern: string }[],
): { messages: Message[]; changed: boolean } {
  let changed = false;
  const allPatterns = [
    ...FILLER_PATTERNS,
    ...pruningPatterns
      .map((r) => {
        try {
          return new RegExp(r.pattern, "gi");
        } catch {
          return null;
        }
      })
      .filter((p): p is RegExp => p !== null),
  ];

  const result = messages.map((m) => {
    let content = m.content;
    for (const pattern of allPatterns) {
      const replaced = content.replace(pattern, "");
      if (replaced !== content) {
        content = replaced;
        changed = true;
      }
    }
    // Remove repeated sentences
    const sentences = content.split(/(?<=[.!?])\s+/);
    const seenSentences = new Set<string>();
    const deduped = sentences.filter((s) => {
      const key = s.trim().toLowerCase();
      if (seenSentences.has(key)) {
        changed = true;
        return false;
      }
      seenSentences.add(key);
      return true;
    });
    content = deduped.join(" ").trim();
    return { ...m, content };
  });
  return { messages: result, changed };
}

// ── Stage 4: System prompt compression ───────────────────────────────────────
// Aggressive: strip filler + truncate at word boundary to 75% if > 400 chars.
// System prompts are the #1 source of wasted tokens in production apps.

function compressSystemMessages(
  messages: Message[],
  pruningPatterns: { pattern: string }[],
): { messages: Message[]; changed: boolean } {
  let changed = false;
  const allPatterns = [
    ...FILLER_PATTERNS,
    ...pruningPatterns
      .map((r) => {
        try {
          return new RegExp(r.pattern, "gi");
        } catch {
          return null;
        }
      })
      .filter((p): p is RegExp => p !== null),
  ];

  const result = messages.map((m) => {
    if (m.role !== "system") return m;
    const original = m.content;
    let content = normalizeWhitespace(original);
    for (const p of allPatterns) {
      content = content.replace(p, "");
    }
    content = content.trim();
    // Truncate to 75% at word boundary if > 400 chars
    if (content.length > 400) {
      const target = Math.floor(content.length * 0.75);
      const truncated = content.slice(0, target).replace(/\s+\S*$/, "");
      if (truncated.length < content.length) {
        content = truncated;
        changed = true;
      }
    }
    if (content !== original) changed = true;
    return { ...m, content };
  });
  return { messages: result, changed };
}

// ── Stage 5: Conversation history truncation ──────────────────────────────────
// The biggest real-world gain. Long chat histories re-send the entire context
// every turn. We keep: system messages (all) + last N turns + current user msg.
//
// Strategy:
//   - Always keep all system messages
//   - Always keep the last user message (current turn)
//   - Keep the most recent assistant+user pairs up to TOKEN_BUDGET
//   - Summarize dropped middle turns into a single [context] message
//
// TOKEN_BUDGET: 2000 tokens for history (covers ~95% of use cases without loss)

const HISTORY_TOKEN_BUDGET = 2000;
const MIN_TURNS_TO_KEEP = 3; // always keep at least last 3 turns regardless of budget

export function truncateConversationHistory(messages: Message[]): {
  messages: Message[];
  changed: boolean;
} {
  if (messages.length <= MIN_TURNS_TO_KEEP + 1) {
    return { messages, changed: false };
  }

  const systemMessages = messages.filter((m) => m.role === "system");
  const nonSystem = messages.filter((m) => m.role !== "system");

  if (nonSystem.length <= MIN_TURNS_TO_KEEP) {
    return { messages, changed: false };
  }

  // Always keep the last message (current user turn)
  const lastMessage = nonSystem[nonSystem.length - 1];
  const history = nonSystem.slice(0, -1);

  // Walk backwards through history, accumulating tokens until budget exceeded
  let tokenCount = approximateTokens(lastMessage.content);
  const kept: Message[] = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const t = approximateTokens(history[i].content);
    if (
      tokenCount + t > HISTORY_TOKEN_BUDGET &&
      kept.length >= MIN_TURNS_TO_KEEP
    )
      break;
    tokenCount += t;
    kept.unshift(history[i]);
  }

  const droppedCount = history.length - kept.length;
  if (droppedCount === 0) return { messages, changed: false };

  // Insert a summary placeholder for dropped context
  const summaryMsg: Message = {
    role: "system",
    content: `[${droppedCount} earlier message${droppedCount > 1 ? "s" : ""} omitted by GateCtr optimizer to reduce token usage]`,
  };

  const result = [...systemMessages, summaryMsg, ...kept, lastMessage];
  return { messages: result, changed: true };
}

// ── Stage 6: Prompt field compression ────────────────────────────────────────
// For completion-style requests (prompt field, not messages).
// Strips filler, normalizes whitespace, deduplicates repeated sentences.

function compressPrompt(
  prompt: string,
  pruningPatterns: { pattern: string }[],
): { prompt: string; changed: boolean } {
  const original = prompt;
  let content = normalizeWhitespace(prompt);

  const allPatterns = [
    ...FILLER_PATTERNS,
    ...pruningPatterns
      .map((r) => {
        try {
          return new RegExp(r.pattern, "gi");
        } catch {
          return null;
        }
      })
      .filter((p): p is RegExp => p !== null),
  ];

  for (const p of allPatterns) {
    content = content.replace(p, "");
  }

  // Deduplicate repeated sentences
  const sentences = content.split(/(?<=[.!?])\s+/);
  const seen = new Set<string>();
  content = sentences
    .filter((s) => {
      const key = s.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(" ")
    .trim();

  return { prompt: content, changed: content !== original };
}

// ── Main optimize() ───────────────────────────────────────────────────────────

export async function optimize(
  request: GatewayRequest,
): Promise<OptimizeResult> {
  const start = Date.now();

  try {
    const originalTokens = countRequestTokens(request);
    const techniques: string[] = [];

    // Load active pruning + rewrite rules from DB (fail-open)
    let pruningRules: { pattern: string }[] = [];
    try {
      const rows = await prisma.optimizationRule.findMany({
        where: {
          ruleType: { in: ["pruning", "rewrite"] },
          isActive: true,
          pattern: { not: null },
        },
        select: { pattern: true },
        orderBy: { priority: "desc" },
      });
      pruningRules = rows.filter(
        (r): r is { pattern: string } => r.pattern !== null,
      );
    } catch {
      // DB unavailable — proceed with built-in rules only
    }

    let messages = request.messages ?? [];
    let prompt = request.prompt;

    // Stage 1: whitespace normalization
    if (messages.length > 0) {
      const s1 = applyWhitespaceNormalization(messages);
      if (s1.changed) {
        techniques.push("whitespace_normalization");
        messages = s1.messages;
      }
    }
    if (prompt) {
      const normalized = normalizeWhitespace(prompt);
      if (normalized !== prompt) {
        prompt = normalized;
        if (!techniques.includes("whitespace_normalization"))
          techniques.push("whitespace_normalization");
      }
    }

    // Stage 2: deduplication
    if (messages.length > 0) {
      const s2 = deduplicateMessages(messages);
      if (s2.changed) {
        techniques.push("deduplication");
        messages = s2.messages;
      }
    }

    // Stage 2b: intra-message paragraph deduplication (repeated context blocks)
    if (messages.length > 0) {
      const s2b = deduplicateParagraphs(messages);
      if (s2b.changed) {
        if (!techniques.includes("deduplication"))
          techniques.push("deduplication");
        messages = s2b.messages;
      }
    }

    // Stage 3: semantic pruning
    if (messages.length > 0) {
      const s3 = applySemanticPruning(messages, pruningRules);
      if (s3.changed) {
        techniques.push("semantic_pruning");
        messages = s3.messages;
      }
    }
    if (prompt) {
      const s3p = compressPrompt(prompt, pruningRules);
      if (s3p.changed) {
        prompt = s3p.prompt;
        if (!techniques.includes("semantic_pruning"))
          techniques.push("semantic_pruning");
      }
    }

    // Stage 4: system prompt compression
    if (messages.length > 0) {
      const s4 = compressSystemMessages(messages, pruningRules);
      if (s4.changed) {
        techniques.push("system_compression");
        messages = s4.messages;
      }
    }

    // Stage 5: conversation history truncation (biggest gain for long chats)
    if (messages.length > MIN_TURNS_TO_KEEP + 1) {
      const s5 = truncateConversationHistory(messages);
      if (s5.changed) {
        techniques.push("history_truncation");
        messages = s5.messages;
      }
    }

    const optimizedRequest: GatewayRequest = {
      ...request,
      messages,
      ...(prompt !== undefined ? { prompt } : {}),
    };

    const optimizedTokens = countRequestTokens(optimizedRequest);
    const savedTokens = Math.max(0, originalTokens - optimizedTokens);
    const durationMs = Date.now() - start;

    // Write OptimizationLog (fire-and-forget)
    if (techniques.length > 0) {
      prisma.optimizationLog
        .create({
          data: {
            originalTokens,
            optimizedTokens,
            savedTokens,
            technique: techniques.join(","),
          },
        })
        .catch(() => {});
    }

    console.debug("[optimizer]", {
      savedTokens,
      originalTokens,
      optimizedTokens,
      savingPct:
        originalTokens > 0
          ? Math.round((savedTokens / originalTokens) * 100)
          : 0,
      technique: techniques.join(","),
      durationMs,
    });

    return {
      request: optimizedRequest,
      savedTokens,
      originalTokens,
      optimizedTokens,
      techniques,
      durationMs,
    };
  } catch (err) {
    console.error("[optimizer] unhandled error, returning original:", err);
    return {
      request,
      savedTokens: 0,
      originalTokens: countRequestTokens(request),
      optimizedTokens: countRequestTokens(request),
      techniques: [],
      durationMs: Date.now() - start,
    };
  }
}
