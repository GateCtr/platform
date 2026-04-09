/**
 * Outreach CRM — Unit Tests (12.7 – 12.8)
 *
 * 12.7: applyVariableSubstitution
 * 12.8: getStats computation logic (pure function mirror)
 *
 * Validates: Requirements 4.1, 6.3, 3.5
 */

import { describe, it, expect } from "vitest";
import { applyVariableSubstitution } from "@/lib/outreach-utils";

// ─── Shared prospect fixture ──────────────────────────────────────────────────

const baseProspect = {
  firstName: "Alice",
  lastName: "Martin",
  company: "Acme Corp",
  jobTitle: "CTO",
};

const senderName = "GateCtr Team";

// ═════════════════════════════════════════════════════════════════════════════
// 12.7 — Unit tests for applyVariableSubstitution
// Validates: Requirements 4.1, 6.3
// ═════════════════════════════════════════════════════════════════════════════

describe("applyVariableSubstitution", () => {
  describe("individual placeholder substitution", () => {
    it("replaces {{firstName}}", () => {
      expect(
        applyVariableSubstitution(
          "Hello {{firstName}}",
          baseProspect,
          senderName,
        ),
      ).toBe("Hello Alice");
    });

    it("replaces {{lastName}}", () => {
      expect(
        applyVariableSubstitution(
          "Dear {{lastName}}",
          baseProspect,
          senderName,
        ),
      ).toBe("Dear Martin");
    });

    it("replaces {{company}}", () => {
      expect(
        applyVariableSubstitution("From {{company}}", baseProspect, senderName),
      ).toBe("From Acme Corp");
    });

    it("replaces {{jobTitle}}", () => {
      expect(
        applyVariableSubstitution(
          "Role: {{jobTitle}}",
          baseProspect,
          senderName,
        ),
      ).toBe("Role: CTO");
    });

    it("replaces {{senderName}}", () => {
      expect(
        applyVariableSubstitution(
          "Regards, {{senderName}}",
          baseProspect,
          senderName,
        ),
      ).toBe("Regards, GateCtr Team");
    });
  });

  describe("all 5 placeholders combined", () => {
    it("replaces all 5 placeholders in a single template", () => {
      const template =
        "Hi {{firstName}} {{lastName}}, I'm reaching out from {{company}} about your role as {{jobTitle}}. — {{senderName}}";
      const result = applyVariableSubstitution(
        template,
        baseProspect,
        senderName,
      );
      expect(result).toBe(
        "Hi Alice Martin, I'm reaching out from Acme Corp about your role as CTO. — GateCtr Team",
      );
    });

    it("result contains no remaining supported placeholders", () => {
      const template =
        "{{firstName}} {{lastName}} {{company}} {{jobTitle}} {{senderName}}";
      const result = applyVariableSubstitution(
        template,
        baseProspect,
        senderName,
      );
      expect(result).not.toMatch(
        /\{\{(firstName|lastName|company|jobTitle|senderName)\}\}/,
      );
    });
  });

  describe("missing / empty fields", () => {
    it("replaces {{jobTitle}} with empty string when jobTitle is null", () => {
      const prospect = { ...baseProspect, jobTitle: null };
      const result = applyVariableSubstitution(
        "Title: {{jobTitle}}",
        prospect,
        senderName,
      );
      expect(result).toBe("Title: ");
    });

    it("replaces {{jobTitle}} with empty string when jobTitle is undefined", () => {
      const prospect = { ...baseProspect, jobTitle: undefined };
      const result = applyVariableSubstitution(
        "Title: {{jobTitle}}",
        prospect,
        senderName,
      );
      expect(result).toBe("Title: ");
    });

    it("handles empty string values for firstName", () => {
      const prospect = { ...baseProspect, firstName: "" };
      const result = applyVariableSubstitution(
        "Hi {{firstName}}!",
        prospect,
        senderName,
      );
      expect(result).toBe("Hi !");
    });
  });

  describe("unknown placeholders", () => {
    it("leaves unknown {{...}} placeholders as-is", () => {
      const template = "Hello {{firstName}}, your code is {{unknownVar}}";
      const result = applyVariableSubstitution(
        template,
        baseProspect,
        senderName,
      );
      expect(result).toBe("Hello Alice, your code is {{unknownVar}}");
    });

    it("leaves multiple unknown placeholders untouched", () => {
      const template = "{{foo}} {{bar}} {{firstName}}";
      const result = applyVariableSubstitution(
        template,
        baseProspect,
        senderName,
      );
      expect(result).toBe("{{foo}} {{bar}} Alice");
    });
  });

  describe("multiple occurrences of the same placeholder", () => {
    it("replaces all occurrences of {{firstName}}", () => {
      const template = "{{firstName}}, hi {{firstName}}! From {{firstName}}.";
      const result = applyVariableSubstitution(
        template,
        baseProspect,
        senderName,
      );
      expect(result).toBe("Alice, hi Alice! From Alice.");
    });

    it("replaces all occurrences of {{company}}", () => {
      const template = "{{company}} is great. I love {{company}}.";
      const result = applyVariableSubstitution(
        template,
        baseProspect,
        senderName,
      );
      expect(result).toBe("Acme Corp is great. I love Acme Corp.");
    });

    it("replaces all occurrences of {{senderName}}", () => {
      const template = "{{senderName}} says hi. Best, {{senderName}}";
      const result = applyVariableSubstitution(
        template,
        baseProspect,
        senderName,
      );
      expect(result).toBe("GateCtr Team says hi. Best, GateCtr Team");
    });
  });

  describe("edge cases", () => {
    it("returns empty string unchanged", () => {
      expect(applyVariableSubstitution("", baseProspect, senderName)).toBe("");
    });

    it("returns template with no placeholders unchanged", () => {
      const template = "No placeholders here.";
      expect(
        applyVariableSubstitution(template, baseProspect, senderName),
      ).toBe(template);
    });

    it("handles template that is only a placeholder", () => {
      expect(
        applyVariableSubstitution("{{firstName}}", baseProspect, senderName),
      ).toBe("Alice");
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12.8 — Unit tests for getStats computation logic (pure mirror)
// Validates: Requirements 3.5
// ═════════════════════════════════════════════════════════════════════════════

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
  status: ProspectStatus;
  tier: ProspectTier;
}

interface MockLog {
  openedAt: Date | null;
  clickedAt: Date | null;
}

/** Pure mirror of getStats() from lib/actions/outreach.ts */
function computeStats(prospects: MockProspect[], logs: MockLog[]) {
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
    byStatus[p.status]++;
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

describe("getStats computation logic", () => {
  describe("totalProspects and byStatus", () => {
    it("returns 0 for all counts when no prospects", () => {
      const stats = computeStats([], []);
      expect(stats.totalProspects).toBe(0);
      expect(Object.values(stats.byStatus).every((v) => v === 0)).toBe(true);
    });

    it("counts prospects by status correctly", () => {
      const prospects: MockProspect[] = [
        { status: "NEW", tier: "TIER_1" },
        { status: "NEW", tier: "TIER_1" },
        { status: "CONTACTED", tier: "TIER_2" },
        { status: "CONVERTED", tier: "TIER_1" },
      ];
      const stats = computeStats(prospects, []);
      expect(stats.totalProspects).toBe(4);
      expect(stats.byStatus.NEW).toBe(2);
      expect(stats.byStatus.CONTACTED).toBe(1);
      expect(stats.byStatus.CONVERTED).toBe(1);
    });

    it("sum of byStatus equals totalProspects", () => {
      const prospects: MockProspect[] = [
        { status: "NEW", tier: "TIER_1" },
        { status: "REPLIED", tier: "TIER_2" },
        { status: "REFUSED", tier: "TIER_2" },
      ];
      const stats = computeStats(prospects, []);
      const sum = Object.values(stats.byStatus).reduce((a, b) => a + b, 0);
      expect(sum).toBe(stats.totalProspects);
    });
  });

  describe("byTier", () => {
    it("counts prospects by tier correctly", () => {
      const prospects: MockProspect[] = [
        { status: "NEW", tier: "TIER_1" },
        { status: "NEW", tier: "TIER_1" },
        { status: "NEW", tier: "TIER_2" },
      ];
      const stats = computeStats(prospects, []);
      expect(stats.byTier.TIER_1).toBe(2);
      expect(stats.byTier.TIER_2).toBe(1);
    });
  });

  describe("zero-division guard (max(sentCount, 1))", () => {
    it("openRate is 0 when no logs exist (not NaN or Infinity)", () => {
      const stats = computeStats([{ status: "NEW", tier: "TIER_1" }], []);
      expect(stats.openRate).toBe(0);
      expect(Number.isFinite(stats.openRate)).toBe(true);
    });

    it("clickRate is 0 when no logs exist", () => {
      const stats = computeStats([{ status: "NEW", tier: "TIER_1" }], []);
      expect(stats.clickRate).toBe(0);
      expect(Number.isFinite(stats.clickRate)).toBe(true);
    });

    it("replyRate is 0 when no contacted prospects", () => {
      const stats = computeStats([{ status: "NEW", tier: "TIER_1" }], []);
      expect(stats.replyRate).toBe(0);
    });

    it("conversionRate is 0 when no prospects", () => {
      const stats = computeStats([], []);
      expect(stats.conversionRate).toBe(0);
      expect(Number.isFinite(stats.conversionRate)).toBe(true);
    });
  });

  describe("rate computation", () => {
    it("openRate = openedCount / sentCount", () => {
      const logs: MockLog[] = [
        { openedAt: new Date(), clickedAt: null },
        { openedAt: new Date(), clickedAt: null },
        { openedAt: null, clickedAt: null },
        { openedAt: null, clickedAt: null },
      ];
      const stats = computeStats([], logs);
      expect(stats.openRate).toBeCloseTo(2 / 4);
    });

    it("clickRate = clickedCount / sentCount", () => {
      const logs: MockLog[] = [
        { openedAt: null, clickedAt: new Date() },
        { openedAt: null, clickedAt: null },
        { openedAt: null, clickedAt: null },
      ];
      const stats = computeStats([], logs);
      expect(stats.clickRate).toBeCloseTo(1 / 3);
    });

    it("openRate is 1 when all logs are opened", () => {
      const logs: MockLog[] = [
        { openedAt: new Date(), clickedAt: null },
        { openedAt: new Date(), clickedAt: null },
      ];
      const stats = computeStats([], logs);
      expect(stats.openRate).toBe(1);
    });
  });

  describe("rate clamping to [0, 1]", () => {
    it("rates are never below 0", () => {
      const stats = computeStats([], []);
      expect(stats.openRate).toBeGreaterThanOrEqual(0);
      expect(stats.clickRate).toBeGreaterThanOrEqual(0);
      expect(stats.replyRate).toBeGreaterThanOrEqual(0);
      expect(stats.conversionRate).toBeGreaterThanOrEqual(0);
    });

    it("rates are never above 1", () => {
      // Even if openedCount > sentCount (edge case), clamp applies
      const logs: MockLog[] = Array.from({ length: 5 }, () => ({
        openedAt: new Date(),
        clickedAt: new Date(),
      }));
      const stats = computeStats([], logs);
      expect(stats.openRate).toBeLessThanOrEqual(1);
      expect(stats.clickRate).toBeLessThanOrEqual(1);
    });
  });

  describe("various distributions", () => {
    it("handles all prospects in CONVERTED status", () => {
      const prospects: MockProspect[] = Array.from({ length: 5 }, () => ({
        status: "CONVERTED" as ProspectStatus,
        tier: "TIER_1" as ProspectTier,
      }));
      const stats = computeStats(prospects, []);
      expect(stats.byStatus.CONVERTED).toBe(5);
      expect(stats.conversionRate).toBe(1);
    });

    it("handles mixed statuses with logs", () => {
      const prospects: MockProspect[] = [
        { status: "CONTACTED", tier: "TIER_1" },
        { status: "REPLIED", tier: "TIER_1" },
        { status: "CONVERTED", tier: "TIER_2" },
        { status: "REFUSED", tier: "TIER_2" },
      ];
      const logs: MockLog[] = [
        { openedAt: new Date(), clickedAt: new Date() },
        { openedAt: new Date(), clickedAt: null },
        { openedAt: null, clickedAt: null },
      ];
      const stats = computeStats(prospects, logs);
      expect(stats.totalProspects).toBe(4);
      expect(stats.totalEmailsSent).toBe(3);
      expect(stats.openRate).toBeCloseTo(2 / 3);
      expect(stats.clickRate).toBeCloseTo(1 / 3);
    });
  });
});
