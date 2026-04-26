import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@workspace/db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "@workspace/db";
import {
  findClinicById,
  listClinics,
  createWaitTimeReport,
  countRecentReports,
  upsertUserByEmail,
  createReview,
} from "../db-queries";

const mockQuery = vi.mocked(pool.query);

function getCallArgs(callIndex = 0): [string, unknown[]] {
  return mockQuery.mock.calls[callIndex] as unknown as [string, unknown[]];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("findClinicById", () => {
  it("issues a parameterized query with the clinic id and returns the first row", async () => {
    const fakeClinic = { id: "c1", name: "ClinicA", city: "NY", state: "NY", address: null, phone: null, isClaimed: false };
    mockQuery.mockResolvedValueOnce({ rows: [fakeClinic] } as never);

    const result = await findClinicById("c1");

    expect(mockQuery).toHaveBeenCalledOnce();
    const [text, values] = getCallArgs();
    expect(text).toMatch(/WHERE id = \$1/);
    expect(values).toEqual(["c1"]);
    expect(result).toEqual(fakeClinic);
  });

  it("returns null when no rows match", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);

    const result = await findClinicById("not-found");

    expect(result).toBeNull();
  });
});

describe("listClinics", () => {
  it("issues a query with no WHERE clause when no filters provided", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);

    await listClinics({});

    const [text, values] = getCallArgs();
    expect(text).not.toMatch(/WHERE/);
    expect(values).toEqual([20, 0]);
  });

  it("binds state filter as a positional parameter", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);

    await listClinics({ state: "CA" });

    const [text, values] = getCallArgs();
    expect(text).toMatch(/state = \$1/);
    expect(values[0]).toBe("CA");
  });

  it("binds city filter as an ILIKE positional parameter", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);

    await listClinics({ city: "Austin" });

    const [text, values] = getCallArgs();
    expect(text).toMatch(/city ILIKE \$1/);
    expect(values[0]).toBe("Austin");
  });

  it("binds search filter with wildcard wrapping", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);

    await listClinics({ search: "care" });

    const [text, values] = getCallArgs();
    expect(text).toMatch(/name ILIKE \$1/);
    expect(values[0]).toBe("%care%");
  });

  it("binds all filters in the correct positional order", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);

    await listClinics({ state: "TX", city: "Houston", search: "urgent", limit: 10, offset: 5 });

    const [text, values] = getCallArgs();
    expect(text).toMatch(/state = \$1/);
    expect(text).toMatch(/city ILIKE \$2/);
    expect(text).toMatch(/name ILIKE \$3/);
    expect(text).toMatch(/LIMIT \$4 OFFSET \$5/);
    expect(values).toEqual(["TX", "Houston", "%urgent%", 10, 5]);
  });

  it("uses default limit=20 and offset=0 when not specified", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);

    await listClinics({ state: "FL" });

    const [, values] = getCallArgs();
    expect(values.at(-2)).toBe(20);
    expect(values.at(-1)).toBe(0);
  });
});

describe("createWaitTimeReport", () => {
  it("inserts with all fields as positional parameters", async () => {
    const fakeReport = { id: "r1", clinicId: "c1", peopleCount: 3, source: "SMS", visitReason: null, reportedByPhone: null, createdAt: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [fakeReport] } as never);

    const result = await createWaitTimeReport({ clinicId: "c1", peopleCount: 3, source: "SMS", visitReason: null, reportedByPhone: null });

    const [text, values] = getCallArgs();
    expect(text).toMatch(/INSERT INTO waiting_room_reports/);
    expect(text).toMatch(/VALUES \(\$1, \$2, \$3, \$4, \$5, NOW\(\)\)/);
    expect(values).toEqual(["c1", 3, "SMS", null, null]);
    expect(result).toEqual(fakeReport);
  });
});

describe("countRecentReports", () => {
  it("queries with phoneHash and windowStart as positional parameters", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: "3" }] } as never);
    const windowStart = new Date("2026-04-25T00:00:00Z");

    const count = await countRecentReports("abc123", windowStart);

    const [text, values] = getCallArgs();
    expect(text).toMatch(/"reportedByPhone" = \$1/);
    expect(text).toMatch(/"createdAt" >= \$2/);
    expect(values).toEqual(["abc123", windowStart.toISOString()]);
    expect(count).toBe(3);
  });
});

describe("upsertUserByEmail", () => {
  it("upserts user with email as positional parameter and returns id", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "u1" }] } as never);

    const result = await upsertUserByEmail("test@example.com");

    const [text, values] = getCallArgs();
    expect(text).toMatch(/ON CONFLICT \(email\) DO UPDATE/);
    expect(values).toEqual(["test@example.com"]);
    expect(result).toEqual({ id: "u1" });
  });
});

describe("createReview", () => {
  it("inserts review with all fields as positional parameters", async () => {
    const fakeReview = { id: "rv1", clinicId: "c1", userId: "u1", rating: 5, body: "Great!", createdAt: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [fakeReview] } as never);

    const result = await createReview({ clinicId: "c1", userId: "u1", rating: 5, body: "Great!" });

    const [text, values] = getCallArgs();
    expect(text).toMatch(/INSERT INTO reviews/);
    expect(text).toMatch(/VALUES \(\$1, \$2, \$3, \$4, NOW\(\)\)/);
    expect(values).toEqual(["c1", "u1", 5, "Great!"]);
    expect(result).toEqual(fakeReview);
  });
});
