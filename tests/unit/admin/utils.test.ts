import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  fillTrendGaps,
  computePlanDistribution,
  validateRolloutPct,
  computeOverallStatus,
  computePctChange,
  topN,
  sortAlertsBySeverity,
  deepKeyStructureEqual,
} from "@/lib/admin/utils";

// ---------------------------------------------------------------------------
// fillTrendGaps
// ---------------------------------------------------------------------------

describe("fillTrendGaps", () => {
  it("returns exactly nDays entries for empty raw data", () => {
    expect(fillTrendGaps([], 7)).toHaveLength(7);
  });

  it("zero-fills missing days", () => {
    const result = fillTrendGaps([], 3);
    expect(result.every((p) => p.count === 0)).toBe(true);
  });

  it("uses raw data when day matches", () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const day = today.toISOString().slice(0, 10);
    const result = fillTrendGaps([{ day, count: 42 }], 1);
    expect(result[0].count).toBe(42);
  });

  it("returns days in ascending order", () => {
    const result = fillTrendGaps([], 5);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].day >= result[i - 1].day).toBe(true);
    }
  });

  // Feature: admin-dashboard, Property 1: trend queries return exactly N data points
  it("Property 1: always returns exactly N data points", () => {
    // **Validates: Requirements 1.3, 9.3**
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 90 }),
        fc.array(
          fc.record({
            day: fc
              .integer({
                min: new Date("2020-01-01").getTime(),
                max: new Date("2026-12-31").getTime(),
              })
              .map((ms) => new Date(ms).toISOString().slice(0, 10)),
            count: fc.nat(),
          }),
        ),
        (nDays, rawData) => {
          const result = fillTrendGaps(rawData, nDays);
          return result.length === nDays;
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// computePlanDistribution
// ---------------------------------------------------------------------------

describe("computePlanDistribution", () => {
  it("returns empty object for empty array", () => {
    expect(computePlanDistribution([])).toEqual({});
  });

  it("counts single plan correctly", () => {
    expect(computePlanDistribution(["FREE", "FREE", "PRO"])).toEqual({
      FREE: 2,
      PRO: 1,
    });
  });

  // Feature: admin-dashboard, Property 2: plan distribution counts sum to total user count
  it("Property 2: distribution counts sum to total user count", () => {
    // **Validates: Requirements 1.4**
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom("FREE", "PRO", "TEAM", "ENTERPRISE")),
        (plans) => {
          const dist = computePlanDistribution(plans);
          const sum = Object.values(dist).reduce((a, b) => a + b, 0);
          return sum === plans.length;
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// validateRolloutPct
// ---------------------------------------------------------------------------

describe("validateRolloutPct", () => {
  it("accepts 0", () => {
    expect(validateRolloutPct(0)).toEqual({ valid: true });
  });

  it("accepts 100", () => {
    expect(validateRolloutPct(100)).toEqual({ valid: true });
  });

  it("accepts 50", () => {
    expect(validateRolloutPct(50)).toEqual({ valid: true });
  });

  it("rejects -1", () => {
    const result = validateRolloutPct(-1);
    expect(result.valid).toBe(false);
  });

  it("rejects 101", () => {
    const result = validateRolloutPct(101);
    expect(result.valid).toBe(false);
  });

  it("rejects non-integer", () => {
    const result = validateRolloutPct(50.5);
    expect(result.valid).toBe(false);
  });

  // Feature: admin-dashboard, Property 7: rollout percentage validation rejects out-of-range values
  it("Property 7: valid iff integer in [0, 100]", () => {
    // **Validates: Requirements 6.3**
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 1000 }), (n) => {
        const result = validateRolloutPct(n);
        if (n >= 0 && n <= 100) return result.valid === true;
        return result.valid === false;
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// computeOverallStatus
// ---------------------------------------------------------------------------

describe("computeOverallStatus", () => {
  it("returns HEALTHY when all healthy", () => {
    expect(computeOverallStatus(["HEALTHY", "HEALTHY"])).toBe("HEALTHY");
  });

  it("returns DEGRADED when any degraded", () => {
    expect(computeOverallStatus(["HEALTHY", "DEGRADED"])).toBe("DEGRADED");
  });

  it("returns DOWN when any down", () => {
    expect(computeOverallStatus(["HEALTHY", "DEGRADED", "DOWN"])).toBe("DOWN");
  });

  it("returns HEALTHY for empty array", () => {
    expect(computeOverallStatus([])).toBe("HEALTHY");
  });

  // Feature: admin-dashboard, Property 9: overall health status equals worst individual service status
  it("Property 9: overall status equals worst individual status", () => {
    // **Validates: Requirements 8.2**
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom("HEALTHY", "DEGRADED", "DOWN"), {
          minLength: 1,
        }),
        (statuses) => {
          const overall = computeOverallStatus(statuses);
          if (statuses.includes("DOWN")) return overall === "DOWN";
          if (statuses.includes("DEGRADED")) return overall === "DEGRADED";
          return overall === "HEALTHY";
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// computePctChange
// ---------------------------------------------------------------------------

describe("computePctChange", () => {
  it("returns 0 when current equals previous", () => {
    expect(computePctChange(100, 100)).toBe(0);
  });

  it("returns 100 when current is double previous", () => {
    expect(computePctChange(200, 100)).toBe(100);
  });

  it("returns -50 when current is half previous", () => {
    expect(computePctChange(50, 100)).toBe(-50);
  });

  it("rounds to one decimal place", () => {
    // (110 - 99) / 99 * 100 = 11.111... → 11.1
    expect(computePctChange(110, 99)).toBe(11.1);
  });

  // Feature: admin-dashboard, Property 10: token percentage change calculation is correct
  it("Property 10: pct change equals ((C - P) / P) * 100 rounded to 1dp", () => {
    // **Validates: Requirements 9.1**
    fc.assert(
      fc.property(
        fc.float({
          min: Math.fround(0.01),
          max: Math.fround(1e6),
          noNaN: true,
        }),
        fc.float({
          min: Math.fround(0.01),
          max: Math.fround(1e6),
          noNaN: true,
        }),
        (current, previous) => {
          const pct = computePctChange(current, previous);
          const expected =
            Math.round(((current - previous) / previous) * 100 * 10) / 10;
          return Math.abs(pct - expected) < 0.001;
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// topN
// ---------------------------------------------------------------------------

describe("topN", () => {
  it("returns at most N items", () => {
    const items = [{ tokens: 3 }, { tokens: 1 }, { tokens: 2 }];
    expect(topN(items, 2)).toHaveLength(2);
  });

  it("returns all items when N >= length", () => {
    const items = [{ tokens: 3 }, { tokens: 1 }];
    expect(topN(items, 5)).toHaveLength(2);
  });

  it("sorts by tokens descending", () => {
    const items = [{ tokens: 1 }, { tokens: 3 }, { tokens: 2 }];
    const result = topN(items, 3);
    expect(result.map((i) => i.tokens)).toEqual([3, 2, 1]);
  });

  it("does not mutate the original array", () => {
    const items = [{ tokens: 1 }, { tokens: 3 }];
    topN(items, 2);
    expect(items[0].tokens).toBe(1);
  });

  // Feature: admin-dashboard, Property 11: top-N query returns at most N results sorted descending
  it("Property 11: at most N results, sorted descending", () => {
    // **Validates: Requirements 9.7**
    fc.assert(
      fc.property(
        fc.array(fc.record({ userId: fc.string(), tokens: fc.nat() })),
        fc.integer({ min: 1, max: 20 }),
        (users, n) => {
          const result = topN(users, n);
          if (result.length > n) return false;
          for (let i = 1; i < result.length; i++) {
            if (result[i].tokens > result[i - 1].tokens) return false;
          }
          return true;
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// sortAlertsBySeverity
// ---------------------------------------------------------------------------

describe("sortAlertsBySeverity", () => {
  it("places critical before warning before info", () => {
    const alerts = [
      { severity: "info" as const, createdAt: new Date("2024-01-01") },
      { severity: "critical" as const, createdAt: new Date("2024-01-01") },
      { severity: "warning" as const, createdAt: new Date("2024-01-01") },
    ];
    const sorted = sortAlertsBySeverity(alerts);
    expect(sorted[0].severity).toBe("critical");
    expect(sorted[1].severity).toBe("warning");
    expect(sorted[2].severity).toBe("info");
  });

  it("sorts by createdAt descending within same severity", () => {
    const alerts = [
      { severity: "warning" as const, createdAt: new Date("2024-01-01") },
      { severity: "warning" as const, createdAt: new Date("2024-01-03") },
      { severity: "warning" as const, createdAt: new Date("2024-01-02") },
    ];
    const sorted = sortAlertsBySeverity(alerts);
    expect(sorted[0].createdAt).toEqual(new Date("2024-01-03"));
    expect(sorted[1].createdAt).toEqual(new Date("2024-01-02"));
    expect(sorted[2].createdAt).toEqual(new Date("2024-01-01"));
  });

  it("does not mutate the original array", () => {
    const alerts = [
      { severity: "info" as const, createdAt: new Date() },
      { severity: "critical" as const, createdAt: new Date() },
    ];
    sortAlertsBySeverity(alerts);
    expect(alerts[0].severity).toBe("info");
  });

  // Feature: admin-dashboard, Property 13: alert sort order is critical → warning → info → createdAt desc
  it("Property 13: critical before warning before info, then createdAt desc", () => {
    // **Validates: Requirements 10.1**
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            severity: fc.constantFrom(
              "critical",
              "warning",
              "info",
            ) as fc.Arbitrary<"critical" | "warning" | "info">,
            createdAt: fc.date(),
          }),
        ),
        (alerts) => {
          const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };
          const sorted = sortAlertsBySeverity(alerts);
          for (let i = 1; i < sorted.length; i++) {
            const prev = SEVERITY_ORDER[sorted[i - 1].severity];
            const curr = SEVERITY_ORDER[sorted[i].severity];
            if (curr < prev) return false;
            if (curr === prev && sorted[i].createdAt > sorted[i - 1].createdAt)
              return false;
          }
          return true;
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// deepKeyStructureEqual
// ---------------------------------------------------------------------------

describe("deepKeyStructureEqual", () => {
  it("returns true for identical flat objects", () => {
    expect(deepKeyStructureEqual({ a: 1, b: 2 }, { a: "x", b: "y" })).toBe(
      true,
    );
  });

  it("returns false when keys differ", () => {
    expect(deepKeyStructureEqual({ a: 1 }, { b: 1 })).toBe(false);
  });

  it("returns false when one has extra key", () => {
    expect(deepKeyStructureEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });

  it("returns true for nested objects with same structure", () => {
    expect(
      deepKeyStructureEqual(
        { a: { x: 1, y: 2 } },
        { a: { x: "hello", y: false } },
      ),
    ).toBe(true);
  });

  it("returns false when nested structure differs", () => {
    expect(deepKeyStructureEqual({ a: { x: 1 } }, { a: { z: 1 } })).toBe(false);
  });

  it("returns false when one value is object and other is not", () => {
    expect(deepKeyStructureEqual({ a: { x: 1 } }, { a: "string" })).toBe(false);
  });

  it("returns true for empty objects", () => {
    expect(deepKeyStructureEqual({}, {})).toBe(true);
  });
});
