import { describe, it, expect } from "vitest";
import {
  calculateWaitTime,
  noWaitData,
  levelColors,
  sourceLabel,
  capacityLabel,
  waitSummaryForSEO,
  estimateWaitTime,
} from "@/lib/wait-time";

// A fixed reference time: 10 seconds ago so elapsed time is negligible
const NOW = new Date();
const JUST_NOW = new Date(NOW.getTime() - 10_000);

describe("calculateWaitTime", () => {
  it("returns SHORT WAIT for small queue at MEDIUM capacity", () => {
    const result = calculateWaitTime(1, JUST_NOW, "CROWDSOURCED_WEB", "MEDIUM");
    expect(result.level).toBe("short");
    expect(result.label).toBe("SHORT WAIT");
    expect(result.isEstimated).toBe(false);
  });

  it("returns MEDIUM WAIT for mid-range queue at MEDIUM capacity", () => {
    const result = calculateWaitTime(4, JUST_NOW, "CROWDSOURCED_WEB", "MEDIUM");
    expect(result.level).toBe("medium");
    expect(result.label).toBe("MEDIUM WAIT");
  });

  it("returns LONG WAIT for large queue at MEDIUM capacity", () => {
    const result = calculateWaitTime(7, JUST_NOW, "CROWDSOURCED_WEB", "MEDIUM");
    expect(result.level).toBe("long");
    expect(result.label).toBe("LONG WAIT");
  });

  it("decays the count as time passes", () => {
    const thirtyMinutesAgo = new Date(NOW.getTime() - 30 * 60_000);
    const result = calculateWaitTime(2, thirtyMinutesAgo, "CROWDSOURCED_WEB", "MEDIUM");
    // 30 min / 20 min-per-patient = 1 patient seen → adjustedCount should be max(0, 2-1) = 1
    expect(result.adjustedCount).toBe(1);
  });

  it("never goes below 0 for adjustedCount", () => {
    const oneHourAgo = new Date(NOW.getTime() - 60 * 60_000);
    const result = calculateWaitTime(2, oneHourAgo, "CROWDSOURCED_WEB", "MEDIUM");
    expect(result.adjustedCount).toBeGreaterThanOrEqual(0);
  });

  it("marks CLINIC_DASHBOARD reports as estimated when stale (3+ hours old)", () => {
    const fourHoursAgo = new Date(NOW.getTime() - 4 * 60 * 60_000);
    const result = calculateWaitTime(3, fourHoursAgo, "CLINIC_DASHBOARD", "MEDIUM");
    expect(result.isEstimated).toBe(true);
  });

  it("does not mark fresh CLINIC_DASHBOARD reports as estimated", () => {
    const result = calculateWaitTime(3, JUST_NOW, "CLINIC_DASHBOARD", "MEDIUM");
    expect(result.isEstimated).toBe(false);
  });

  it("respects SMALL capacity thresholds (tighter limits)", () => {
    // SMALL: shortMax=1, mediumMax=3 → 4+ = long
    const result = calculateWaitTime(4, JUST_NOW, "CROWDSOURCED_WEB", "SMALL");
    expect(result.level).toBe("long");
  });

  it("respects LARGE capacity thresholds (wider limits)", () => {
    // LARGE: shortMax=3 → 2 people = short wait
    const result = calculateWaitTime(2, JUST_NOW, "CROWDSOURCED_WEB", "LARGE");
    expect(result.level).toBe("short");
  });

  it("sets estimatedMinutes correctly", () => {
    const result = calculateWaitTime(3, JUST_NOW, "CROWDSOURCED_WEB", "MEDIUM", 15);
    expect(result.estimatedMinutes).toBe(result.adjustedCount * 15);
  });
});

describe("noWaitData", () => {
  it("returns an unknown-level estimate with no source", () => {
    const result = noWaitData();
    expect(result.level).toBe("unknown");
    expect(result.label).toBe("No Data");
    expect(result.source).toBeNull();
    expect(result.lastUpdatedAt).toBeNull();
    expect(result.isEstimated).toBe(false);
    expect(result.adjustedCount).toBe(0);
  });
});

describe("levelColors", () => {
  it("returns green classes for short", () => {
    const c = levelColors("short");
    expect(c.bg).toContain("green");
    expect(c.text).toContain("green");
  });

  it("returns yellow classes for medium", () => {
    const c = levelColors("medium");
    expect(c.bg).toContain("yellow");
  });

  it("returns red classes for long", () => {
    const c = levelColors("long");
    expect(c.bg).toContain("red");
  });

  it("returns gray classes for unknown", () => {
    const c = levelColors("unknown");
    expect(c.bg).toContain("gray");
  });
});

describe("capacityLabel", () => {
  it("labels SMALL clinics correctly", () => {
    expect(capacityLabel("SMALL")).toBe("Small clinic");
  });
  it("labels MEDIUM clinics correctly", () => {
    expect(capacityLabel("MEDIUM")).toBe("Mid-size clinic");
  });
  it("labels LARGE clinics correctly", () => {
    expect(capacityLabel("LARGE")).toBe("Large clinic");
  });
});

describe("sourceLabel", () => {
  it("returns 'No recent data' when source is null", () => {
    expect(sourceLabel(null, null)).toBe("No recent data");
  });

  it("says 'Reported by a visitor' for crowdsourced source", () => {
    const label = sourceLabel("CROWDSOURCED_WEB", JUST_NOW);
    expect(label).toContain("Reported by a visitor");
  });

  it("says 'Updated by clinic' for clinic dashboard source", () => {
    const label = sourceLabel("CLINIC_DASHBOARD", JUST_NOW);
    expect(label).toContain("Updated by clinic");
  });

  it("returns estimation string for estimated source", () => {
    const label = sourceLabel("estimated", JUST_NOW);
    expect(label).toContain("Estimated");
  });
});

describe("waitSummaryForSEO", () => {
  it("returns unknown text when level is unknown", () => {
    const summary = waitSummaryForSEO(noWaitData());
    expect(summary).toBe("Wait time unknown");
  });

  it("returns 'Little to no wait' for 0 people", () => {
    const estimate = calculateWaitTime(0, JUST_NOW, "CROWDSOURCED_WEB", "MEDIUM");
    const summary = waitSummaryForSEO(estimate);
    expect(summary).toBe("Little to no wait right now");
  });

  it("includes minutes and people count in summary", () => {
    const estimate = calculateWaitTime(3, JUST_NOW, "CROWDSOURCED_WEB", "MEDIUM");
    if (estimate.adjustedCount > 0) {
      expect(waitSummaryForSEO(estimate)).toMatch(/min wait/);
      expect(waitSummaryForSEO(estimate)).toMatch(/people|person/);
    }
  });
});

describe("estimateWaitTime", () => {
  it("returns an estimated result with a valid level", () => {
    const result = estimateWaitTime({
      clinicId: "test-clinic-1",
      citySlug: "new-york",
      capacity: "MEDIUM",
    });
    expect(["short", "medium", "long"]).toContain(result.level);
    expect(result.isEstimated).toBe(true);
    expect(result.source).toBe("estimated");
  });

  it("blends historical data when provided", () => {
    const result = estimateWaitTime({
      clinicId: "test-clinic-2",
      citySlug: "brooklyn",
      capacity: "MEDIUM",
      historicalAvgPeople: 8,
    });
    expect(result.adjustedCount).toBeGreaterThanOrEqual(0);
    expect(result.level).toBeDefined();
  });

  it("produces a stable result for the same clinic and time bucket", () => {
    const fixedNow = new Date("2025-03-15T14:00:00Z");
    const a = estimateWaitTime({ clinicId: "abc", citySlug: "brooklyn", capacity: "MEDIUM", now: fixedNow });
    const b = estimateWaitTime({ clinicId: "abc", citySlug: "brooklyn", capacity: "MEDIUM", now: fixedNow });
    expect(a.adjustedCount).toBe(b.adjustedCount);
    expect(a.level).toBe(b.level);
  });
});
