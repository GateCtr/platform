/**
 * Computes the estimated number of tokens saved by the cache.
 *
 * For each cache entry, tokens saved = promptTokens * hitCount
 * (each cache hit avoids re-sending the prompt to the LLM).
 *
 * Requirements: 8.4
 */
export function computeEstimatedTokensSaved(
  entries: { promptTokens: number; hitCount: number }[],
): number {
  return entries.reduce(
    (sum, entry) => sum + entry.promptTokens * entry.hitCount,
    0,
  );
}
