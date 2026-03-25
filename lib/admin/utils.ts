/**
 * Admin utility functions — pure data-transformation helpers
 * used across admin pages.
 */

// ---------------------------------------------------------------------------
// fillTrendGaps
// ---------------------------------------------------------------------------

export interface TrendDataPoint {
  day: string; // YYYY-MM-DD
  count: number;
}

/**
 * Given raw daily counts and a window size N, returns exactly N entries
 * (one per calendar day) covering the N most recent days (today going back
 * N-1 days). Days missing from rawData are zero-filled.
 */
export function fillTrendGaps(
  rawData: TrendDataPoint[],
  nDays: number,
): TrendDataPoint[] {
  // Build a lookup map from the raw data
  const lookup = new Map<string, number>();
  for (const point of rawData) {
    lookup.set(point.day, point.count);
  }

  const result: TrendDataPoint[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = nDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - i);
    const day = date.toISOString().slice(0, 10); // YYYY-MM-DD
    result.push({ day, count: lookup.get(day) ?? 0 });
  }

  return result;
}

// ---------------------------------------------------------------------------
// computePlanDistribution
// ---------------------------------------------------------------------------

/**
 * Counts occurrences of each plan value in the provided array.
 * Returns a Record mapping plan name → count.
 */
export function computePlanDistribution(
  plans: string[],
): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const plan of plans) {
    dist[plan] = (dist[plan] ?? 0) + 1;
  }
  return dist;
}

// ---------------------------------------------------------------------------
// validateRolloutPct
// ---------------------------------------------------------------------------

export type RolloutValidResult = { valid: true };
export type RolloutInvalidResult = { valid: false; error: string };
export type RolloutValidationResult = RolloutValidResult | RolloutInvalidResult;

/**
 * Validates that value is an integer in [0, 100].
 * Returns { valid: true } on success, { valid: false, error } otherwise.
 */
export function validateRolloutPct(value: number): RolloutValidationResult {
  if (!Number.isInteger(value)) {
    return {
      valid: false,
      error: "Rollout must be an integer between 0 and 100.",
    };
  }
  if (value < 0 || value > 100) {
    return {
      valid: false,
      error: "Rollout must be an integer between 0 and 100.",
    };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// computeOverallStatus
// ---------------------------------------------------------------------------

export type ServiceStatus = "HEALTHY" | "DEGRADED" | "DOWN";

/**
 * Returns the worst status from the provided list:
 * DOWN > DEGRADED > HEALTHY.
 * Returns 'HEALTHY' for an empty list.
 */
export function computeOverallStatus(statuses: string[]): ServiceStatus {
  if (statuses.includes("DOWN")) return "DOWN";
  if (statuses.includes("DEGRADED")) return "DEGRADED";
  return "HEALTHY";
}

// ---------------------------------------------------------------------------
// computePctChange
// ---------------------------------------------------------------------------

/**
 * Returns ((current - previous) / previous) * 100 rounded to one decimal place.
 * Assumes previous !== 0.
 */
export function computePctChange(current: number, previous: number): number {
  const raw = ((current - previous) / previous) * 100;
  return Math.round(raw * 10) / 10;
}

// ---------------------------------------------------------------------------
// topN
// ---------------------------------------------------------------------------

/**
 * Returns at most N items from the array sorted by `tokens` descending.
 */
export function topN<T extends { tokens: number }>(items: T[], n: number): T[] {
  return [...items].sort((a, b) => b.tokens - a.tokens).slice(0, n);
}

// ---------------------------------------------------------------------------
// sortAlertsBySeverity
// ---------------------------------------------------------------------------

export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertLike {
  severity: AlertSeverity;
  createdAt: Date;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/**
 * Sorts alerts by severity (critical → warning → info), then by createdAt
 * descending within each severity group.
 * Returns a new array; does not mutate the input.
 */
export function sortAlertsBySeverity<T extends AlertLike>(alerts: T[]): T[] {
  return [...alerts].sort((a, b) => {
    const severityDiff =
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

// ---------------------------------------------------------------------------
// deepKeyStructureEqual
// ---------------------------------------------------------------------------

/**
 * Recursively checks that two objects share identical key structure.
 * Values may differ; only key names and nesting depth are compared.
 */
export function deepKeyStructureEqual(a: object, b: object): boolean {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();

  if (aKeys.length !== bKeys.length) return false;
  if (aKeys.some((k, i) => k !== bKeys[i])) return false;

  for (const key of aKeys) {
    const aVal = (a as Record<string, unknown>)[key];
    const bVal = (b as Record<string, unknown>)[key];

    const aIsObj =
      aVal !== null && typeof aVal === "object" && !Array.isArray(aVal);
    const bIsObj =
      bVal !== null && typeof bVal === "object" && !Array.isArray(bVal);

    if (aIsObj !== bIsObj) return false;
    if (aIsObj && bIsObj) {
      if (!deepKeyStructureEqual(aVal as object, bVal as object)) return false;
    }
  }

  return true;
}
