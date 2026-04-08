/**
 * Computes the overall system health status from an array of per-service statuses.
 *
 * - Returns "down" if any status is "DOWN"
 * - Returns "degraded" if any status is "DEGRADED" (and none are "DOWN")
 * - Returns "healthy" otherwise
 */
export function computeOverallStatus(statuses: string[]): string {
  if (statuses.includes("DOWN")) return "down";
  if (statuses.includes("DEGRADED") || statuses.includes("unknown"))
    return "degraded";
  return "healthy";
}
