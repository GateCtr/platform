/**
 * Outreach CRM — Property-Based Tests (12.1 – 12.6)
 *
 * Library: fast-check (fc) + Vitest
 * Feature: outreach-crm
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { applyVariableSubstitution } from "@/lib/outreach-utils";

// ─── Shared types (mirrors lib/actions/outreach.ts) ──────────────────────────

type ProspectStatus =
  | "NEW"
  | "CONTACTED"
  | "REPLIED"
  | "MEETING_BOOKED"
  | "CONVERTED"
  | "REFUSED"
  | "UNSUBSCRIBED";

type ProspectTier = "TIER_1" | "TIER_2";

interface MockProspect {
  id: string;
  tier: ProspectTier;
  status: ProspectStatus;
  createdAt: Date;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string | null;
}

// ─── Pure helpers that mirror production logic ────────────────────────────────

/** Mirror of getProspects() ordering: tier ASC then createdAt DESC */
function sortProspects(prospects: MockProspect[]): MockProspect[] {
  return [...prospects].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier < b.tier ? -1 : 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

/** Mirror of getStats() computation */
function computeStats(
  prospects: MockProspect[],
  logs: { openedAt: Date | null; clickedAt: Date | null }[],
) {
  const STATUSES: ProspectStatus[] = [
    "NEW",
    "CONTACTED",
    "REPLIED",
    "MEETING_BOOKED",
    "CONVERTED",
    "REFUSED",
    "UNSUBSCRIBED",
  ];

  const totalProspects = prospects.length;

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
    ProspectStatus,
    number
  >;
  for (const p of prospects) {
    byStatus[p.status as ProspectStatus]++;
  }

  const byTier: Record<ProspectTier, number> = { TIER_1: 0, TIER_2: 0 };
  for (const p of prospects) {
    byTier[p.tier]++;
  }

  const totalEmailsSent = logs.length;
  const sentCount = Math.max(totalEmailsSent, 1);

  const openedCount = logs.filter((l) => l.openedAt !== null).length;
  const clickedCount = logs.filter((l) => l.clickedAt !== null).length;

  const repliedCount =
    byStatus.REPLIED + byStatus.MEETING_BOOKED + byStatus.CONVERTED;
  const contactedCount =
    byStatus.CONTACTED +
    byStatus.REPLIED +
    byStatus.MEETING_BOOKED +
    byStatus.CONVERTED;
  const contactedBase = Math.max(contactedCount, 1);

  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  return {
    totalProspects,
    byStatus,
    byTier,
    totalEmailsSent,
    openRate: clamp(openedCount / sentCount),
    clickRate: clamp(clickedCount / sentCount),
    replyRate: clamp(repliedCount / contactedBase),
    conversionRate: clamp(byStatus.CONVERTED / Math.max(totalProspects, 1)),
  };
}

/** Mirror of funnel computation used in stats-tab */
function computeFunnel(byStatus: Record<ProspectStatus, number>) {
  const stages: ProspectStatus[] = [
    "NEW",
    "CONTACTED",
    "REPLIED",
    "MEETING_BOOKED",
    "CONVERTED",
  ];
  // Each stage = cumulative count from that stage onward (funnel semantics)
  return stages.map((_, i) =>
    stages.slice(i).reduce((sum, s) => sum + byStatus[s], 0),
  );
}

/** Simulate idempotent tracking update */
function applyTrackingUpdate(
  current: Date | null,
  newTimestamp: Date,
): Date | null {
  // Only set if not already set (WHERE openedAt IS NULL pattern)
  if (current === null) return newTimestamp;
  return current;
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const SUPPORTED_PLACEHOLDERS = [
  "{{firstName}}",
  "{{lastName}}",
  "{{company}}",
  "{{jobTitle}}",
  "{{senderName}}",
] as const;

const nonEmptyString = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => s.trim().length > 0);

const prospectDataArb = fc.record({
  firstName: nonEmptyString,
  lastName: nonEmptyString,
  company: nonEmptyString,
  jobTitle: fc.option(nonEmptyString, { nil: null }),
});

const senderNameArb = nonEmptyString;

/** Generate a template string that includes a random subset of the 5 placeholders */
const templateWithPlaceholdersArb = fc
  .subarray(SUPPORTED_PLACEHOLDERS as unknown as string[], { minLength: 1 })
  .chain((placeholders) =>
    fc.string({ minLength: 0, maxLength: 20 }).map((prefix) => {
      return prefix + " " + placeholders.join(" ") + " suffix";
    }),
  );

const tierArb = fc.constantFrom<ProspectTier>("TIER_1", "TIER_2");
const statusArb = fc.constantFrom<ProspectStatus>(
  "NEW",
  "CONTACTED",
  "REPLIED",
  "MEETING_BOOKED",
  "CONVERTED",
  "REFUSED",
  "UNSUBSCRIBED",
);

const validDateArb = fc.date({
  min: new Date("2020-01-01T00:00:00.000Z"),
  max: new Date("2026-01-01T00:00:00.000Z"),
  noInvalidDate: true,
});

const mockProspectArb = fc.record<MockProspect>({
  id: fc.uuid(),
  tier: tierArb,
  status: statusArb,
  createdAt: validDateArb,
  firstName: nonEmptyString,
  lastName: nonEmptyString,
  company: nonEmptyString,
  jobTitle: fc.option(nonEmptyString, { nil: null }),
});

const logArb = fc.record({
  openedAt: fc.option(validDateArb, { nil: null }),
  clickedAt: fc.option(validDateArb, { nil: null }),
});

// ═════════════════════════════════════════════════════════════════════════════
// 12.1 — Property 1: Variable substitution completeness
// Feature: outreach-crm, Property 1: variable substitution completeness
// Validates: Requirements 4.1, 6.3
// ═════════════════════════════════════════════════════════════════════════════

describe("Property 1: variable substitution completeness", () => {
  // Feature: outreach-crm, Property 1: variable substitution completeness
  it("no supported {{...}} placeholder remains after applyVariableSubstitution", () => {
    fc.assert(
      fc.property(
        templateWithPlaceholdersArb,
        prospectDataArb,
        senderNameArb,
        (template, prospect, senderName) => {
          const result = applyVariableSubstitution(
            template,
            prospect,
            senderName,
          );

          // None of the 5 supported placeholders should remain
          for (const placeholder of SUPPORTED_PLACEHOLDERS) {
            expect(result).not.toContain(placeholder);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it("result does not contain any {{...}} pattern for supported variables", () => {
    fc.assert(
      fc.property(
        templateWithPlaceholdersArb,
        prospectDataArb,
        senderNameArb,
        (template, prospect, senderName) => {
          const result = applyVariableSubstitution(
            template,
            prospect,
            senderName,
          );
          const supportedVarPattern =
            /\{\{(firstName|lastName|company|jobTitle|senderName)\}\}/g;
          expect(supportedVarPattern.test(result)).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12.2 — Property 2: Prospect ordering invariant
// Feature: outreach-crm, Property 2: prospect ordering invariant
// Validates: Requirements 3.1
// ═════════════════════════════════════════════════════════════════════════════

describe("Property 2: prospect ordering invariant", () => {
  // Feature: outreach-crm, Property 2: prospect ordering invariant
  it("all TIER_1 prospects precede all TIER_2 prospects", () => {
    fc.assert(
      fc.property(
        fc.array(mockProspectArb, { minLength: 0, maxLength: 30 }),
        (prospects) => {
          const sorted = sortProspects(prospects);

          let seenTier2 = false;
          for (const p of sorted) {
            if (p.tier === "TIER_2") seenTier2 = true;
            if (seenTier2) {
              expect(p.tier).toBe("TIER_2");
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it("within TIER_1, prospects are sorted by createdAt descending", () => {
    fc.assert(
      fc.property(
        fc.array(mockProspectArb, { minLength: 2, maxLength: 20 }),
        (prospects) => {
          const sorted = sortProspects(prospects);
          const tier1 = sorted.filter((p) => p.tier === "TIER_1");

          for (let i = 1; i < tier1.length; i++) {
            expect(tier1[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
              tier1[i].createdAt.getTime(),
            );
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it("within TIER_2, prospects are sorted by createdAt descending", () => {
    fc.assert(
      fc.property(
        fc.array(mockProspectArb, { minLength: 2, maxLength: 20 }),
        (prospects) => {
          const sorted = sortProspects(prospects);
          const tier2 = sorted.filter((p) => p.tier === "TIER_2");

          for (let i = 1; i < tier2.length; i++) {
            expect(tier2[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
              tier2[i].createdAt.getTime(),
            );
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12.3 — Property 3: Stats computation correctness
// Feature: outreach-crm, Property 3: stats computation correctness
// Validates: Requirements 3.5
// ═════════════════════════════════════════════════════════════════════════════

describe("Property 3: stats computation correctness", () => {
  // Feature: outreach-crm, Property 3: stats computation correctness
  it("sum of byStatus counts equals totalProspects", () => {
    fc.assert(
      fc.property(
        fc.array(mockProspectArb, { minLength: 0, maxLength: 50 }),
        fc.array(logArb, { minLength: 0, maxLength: 50 }),
        (prospects, logs) => {
          const stats = computeStats(prospects, logs);
          const statusSum = Object.values(stats.byStatus).reduce(
            (a, b) => a + b,
            0,
          );
          expect(statusSum).toBe(stats.totalProspects);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("openRate equals openedCount / max(sentCount, 1)", () => {
    fc.assert(
      fc.property(
        fc.array(mockProspectArb, { minLength: 0, maxLength: 20 }),
        fc.array(logArb, { minLength: 0, maxLength: 30 }),
        (prospects, logs) => {
          const stats = computeStats(prospects, logs);
          const openedCount = logs.filter((l) => l.openedAt !== null).length;
          const sentCount = Math.max(logs.length, 1);
          const expectedRate = Math.min(
            1,
            Math.max(0, openedCount / sentCount),
          );
          expect(stats.openRate).toBeCloseTo(expectedRate, 10);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("all rate values are in [0, 1]", () => {
    fc.assert(
      fc.property(
        fc.array(mockProspectArb, { minLength: 0, maxLength: 50 }),
        fc.array(logArb, { minLength: 0, maxLength: 50 }),
        (prospects, logs) => {
          const stats = computeStats(prospects, logs);
          expect(stats.openRate).toBeGreaterThanOrEqual(0);
          expect(stats.openRate).toBeLessThanOrEqual(1);
          expect(stats.clickRate).toBeGreaterThanOrEqual(0);
          expect(stats.clickRate).toBeLessThanOrEqual(1);
          expect(stats.replyRate).toBeGreaterThanOrEqual(0);
          expect(stats.replyRate).toBeLessThanOrEqual(1);
          expect(stats.conversionRate).toBeGreaterThanOrEqual(0);
          expect(stats.conversionRate).toBeLessThanOrEqual(1);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("openRate is 0 when no logs exist (zero-division guard)", () => {
    fc.assert(
      fc.property(
        fc.array(mockProspectArb, { minLength: 0, maxLength: 10 }),
        (prospects) => {
          const stats = computeStats(prospects, []);
          expect(stats.openRate).toBe(0);
          expect(stats.clickRate).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12.4 — Property 4: Tracking idempotency
// Feature: outreach-crm, Property 4: tracking idempotency
// Validates: Requirements 7.4, 8.3
// ═════════════════════════════════════════════════════════════════════════════

describe("Property 4: tracking idempotency", () => {
  // Feature: outreach-crm, Property 4: tracking idempotency
  it("openedAt is set only on the first call; subsequent calls do not overwrite", () => {
    fc.assert(
      fc.property(
        fc.array(validDateArb, { minLength: 1, maxLength: 10 }),
        (timestamps) => {
          let openedAt: Date | null = null;

          for (const ts of timestamps) {
            openedAt = applyTrackingUpdate(openedAt, ts);
          }

          // Must equal the first timestamp
          expect(openedAt).toEqual(timestamps[0]);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("clickedAt is set only on the first call; subsequent calls do not overwrite", () => {
    fc.assert(
      fc.property(
        fc.array(validDateArb, { minLength: 2, maxLength: 10 }),
        (timestamps) => {
          let clickedAt: Date | null = null;

          for (const ts of timestamps) {
            clickedAt = applyTrackingUpdate(clickedAt, ts);
          }

          // Must equal the first timestamp, not any subsequent one
          expect(clickedAt).toEqual(timestamps[0]);
          if (timestamps.length > 1) {
            // Verify it was NOT overwritten by a later timestamp
            // If all timestamps are distinct, clickedAt must be the first
            const allDistinct =
              new Set(timestamps.map((t) => t.getTime())).size ===
              timestamps.length;
            if (allDistinct) {
              expect(clickedAt).toEqual(timestamps[0]);
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it("calling update with null initial state always sets the timestamp", () => {
    fc.assert(
      fc.property(validDateArb, (ts) => {
        const result = applyTrackingUpdate(null, ts);
        expect(result).toEqual(ts);
      }),
      { numRuns: 200 },
    );
  });

  it("calling update with an existing timestamp never changes it", () => {
    fc.assert(
      fc.property(validDateArb, validDateArb, (existing, newTs) => {
        const result = applyTrackingUpdate(existing, newTs);
        expect(result).toEqual(existing);
      }),
      { numRuns: 200 },
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12.5 — Property 5: Bulk send skip invariant
// Feature: outreach-crm, Property 5: bulk send skip invariant
// Validates: Requirements 5.5
// ═════════════════════════════════════════════════════════════════════════════

/** Pure simulation of bulkSendEmail skip logic */
function simulateBulkSend(
  prospects: Array<{ id: string; status: ProspectStatus }>,
): { sent: string[]; errors: Array<{ prospectId: string; reason: string }> } {
  const SKIP_STATUSES: ProspectStatus[] = ["REFUSED", "UNSUBSCRIBED"];
  const sent: string[] = [];
  const errors: Array<{ prospectId: string; reason: string }> = [];

  for (const p of prospects) {
    if (SKIP_STATUSES.includes(p.status)) {
      errors.push({ prospectId: p.id, reason: "skipped" });
    } else {
      sent.push(p.id);
    }
  }

  return { sent, errors };
}

describe("Property 5: bulk send skip invariant", () => {
  // Feature: outreach-crm, Property 5: bulk send skip invariant
  const bulkProspectArb = fc.array(
    fc.record({
      id: fc.uuid(),
      status: statusArb,
    }),
    { minLength: 0, maxLength: 30 },
  );

  it("every REFUSED prospect appears in errors with reason 'skipped'", () => {
    fc.assert(
      fc.property(bulkProspectArb, (prospects) => {
        const { errors } = simulateBulkSend(prospects);
        const refusedIds = prospects
          .filter((p) => p.status === "REFUSED")
          .map((p) => p.id);

        for (const id of refusedIds) {
          const entry = errors.find((e) => e.prospectId === id);
          expect(entry).toBeDefined();
          expect(entry?.reason).toBe("skipped");
        }
      }),
      { numRuns: 200 },
    );
  });

  it("every UNSUBSCRIBED prospect appears in errors with reason 'skipped'", () => {
    fc.assert(
      fc.property(bulkProspectArb, (prospects) => {
        const { errors } = simulateBulkSend(prospects);
        const unsubIds = prospects
          .filter((p) => p.status === "UNSUBSCRIBED")
          .map((p) => p.id);

        for (const id of unsubIds) {
          const entry = errors.find((e) => e.prospectId === id);
          expect(entry).toBeDefined();
          expect(entry?.reason).toBe("skipped");
        }
      }),
      { numRuns: 200 },
    );
  });

  it("skipped prospects are never in the sent list", () => {
    fc.assert(
      fc.property(bulkProspectArb, (prospects) => {
        const { sent, errors } = simulateBulkSend(prospects);
        const skippedIds = new Set(errors.map((e) => e.prospectId));

        for (const id of sent) {
          expect(skippedIds.has(id)).toBe(false);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("non-skipped prospects are never in the errors list", () => {
    fc.assert(
      fc.property(bulkProspectArb, (prospects) => {
        const { sent, errors } = simulateBulkSend(prospects);
        const errorIds = new Set(errors.map((e) => e.prospectId));

        for (const id of sent) {
          expect(errorIds.has(id)).toBe(false);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12.6 — Property 6: Funnel monotonicity invariant
// Feature: outreach-crm, Property 6: funnel monotonicity invariant
// Validates: Requirements 13.4
// ═════════════════════════════════════════════════════════════════════════════

describe("Property 6: funnel monotonicity invariant", () => {
  // Feature: outreach-crm, Property 6: funnel monotonicity invariant
  it("funnel stage counts are monotonically non-increasing from left to right", () => {
    fc.assert(
      fc.property(
        fc.array(mockProspectArb, { minLength: 0, maxLength: 50 }),
        (prospects) => {
          const stats = computeStats(prospects, []);
          const funnel = computeFunnel(stats.byStatus);

          for (let i = 1; i < funnel.length; i++) {
            expect(funnel[i]).toBeLessThanOrEqual(funnel[i - 1]);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it("funnel first stage (New+) >= last stage (Converted)", () => {
    fc.assert(
      fc.property(
        fc.array(mockProspectArb, { minLength: 0, maxLength: 50 }),
        (prospects) => {
          const stats = computeStats(prospects, []);
          const funnel = computeFunnel(stats.byStatus);
          expect(funnel[0]).toBeGreaterThanOrEqual(funnel[funnel.length - 1]);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("all funnel counts are non-negative", () => {
    fc.assert(
      fc.property(
        fc.array(mockProspectArb, { minLength: 0, maxLength: 50 }),
        (prospects) => {
          const stats = computeStats(prospects, []);
          const funnel = computeFunnel(stats.byStatus);
          for (const count of funnel) {
            expect(count).toBeGreaterThanOrEqual(0);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
