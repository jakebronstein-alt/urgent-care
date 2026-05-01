import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Drizzle mock helpers ──────────────────────────────────────────────────────

let _selectResult: unknown[] = [];
let _insertValues: unknown = null;

function makeSelectChain(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  const terminalFn = vi.fn().mockResolvedValue(rows);
  ["from", "where", "limit", "orderBy"].forEach((name) => {
    chain[name] = vi.fn().mockReturnValue(chain);
  });
  chain["offset"] = terminalFn;
  (chain as Record<string, unknown>)["then"] = (resolve: (v: unknown[]) => void) => resolve(rows);
  return chain;
}

const mockReturning = vi.fn();
const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning });
const mockValues = vi.fn().mockImplementation((vals: unknown) => {
  _insertValues = vals;
  return { returning: mockReturning, onConflictDoUpdate: mockOnConflict };
});
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
const mockSelect = vi.fn().mockImplementation(() => makeSelectChain(_selectResult));

const mockEq = vi.fn((col: unknown, val: unknown) => ({ op: "eq", col, val }));
const mockIlike = vi.fn((col: unknown, val: unknown) => ({ op: "ilike", col, val }));
const mockAnd = vi.fn((...args: unknown[]) => ({ op: "and", args }));
const mockGte = vi.fn((col: unknown, val: unknown) => ({ op: "gte", col, val }));
const mockCount = vi.fn(() => ({ fn: "count" }));
const mockSql = Object.assign(vi.fn((strings: TemplateStringsArray) => strings[0]), { raw: vi.fn() });

vi.mock("@workspace/db", () => ({
  get db() {
    return { select: mockSelect, insert: mockInsert };
  },
  get eq() { return mockEq; },
  get ilike() { return mockIlike; },
  get and() { return mockAnd; },
  get gte() { return mockGte; },
  get count() { return mockCount; },
  get sql() { return mockSql; },
  clinicsTable: {
    id: "clinicsTable.id",
    name: "clinicsTable.name",
    city: "clinicsTable.city",
    state: "clinicsTable.state",
    address: "clinicsTable.address",
    phone: "clinicsTable.phone",
    isClaimed: "clinicsTable.isClaimed",
  },
  usersTable: {
    id: "usersTable.id",
    email: "usersTable.email",
    name: "usersTable.name",
    createdAt: "usersTable.createdAt",
  },
  reviewsTable: {
    id: "reviewsTable.id",
    clinicId: "reviewsTable.clinicId",
    userId: "reviewsTable.userId",
    rating: "reviewsTable.rating",
    body: "reviewsTable.body",
    createdAt: "reviewsTable.createdAt",
  },
  waitingRoomReportsTable: {
    id: "waitingRoomReportsTable.id",
    clinicId: "waitingRoomReportsTable.clinicId",
    peopleCount: "waitingRoomReportsTable.peopleCount",
    source: "waitingRoomReportsTable.source",
    visitReason: "waitingRoomReportsTable.visitReason",
    reportedByPhone: "waitingRoomReportsTable.reportedByPhone",
    createdAt: "waitingRoomReportsTable.createdAt",
  },
}));

import {
  findClinicById,
  listClinics,
  createWaitTimeReport,
  countRecentReports,
  upsertUserByEmail,
  createReview,
} from "../db-queries";

beforeEach(() => {
  vi.clearAllMocks();
  _selectResult = [];
  _insertValues = null;
  mockSelect.mockImplementation(() => makeSelectChain(_selectResult));
  mockInsert.mockReturnValue({ values: mockValues });
  mockValues.mockImplementation((vals: unknown) => {
    _insertValues = vals;
    return { returning: mockReturning, onConflictDoUpdate: mockOnConflict };
  });
  mockOnConflict.mockReturnValue({ returning: mockReturning });
  mockEq.mockImplementation((col: unknown, val: unknown) => ({ op: "eq", col, val }));
  mockIlike.mockImplementation((col: unknown, val: unknown) => ({ op: "ilike", col, val }));
  mockAnd.mockImplementation((...args: unknown[]) => ({ op: "and", args }));
  mockGte.mockImplementation((col: unknown, val: unknown) => ({ op: "gte", col, val }));
});

// ── findClinicById ────────────────────────────────────────────────────────────

describe("findClinicById", () => {
  it("returns the matching clinic when found", async () => {
    const fakeClinic = { id: "c1", name: "ClinicA", city: "NY", state: "NY", address: null, phone: null, isClaimed: false };
    _selectResult = [fakeClinic];

    const result = await findClinicById("c1");

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockEq).toHaveBeenCalledWith("clinicsTable.id", "c1");
    expect(result).toEqual(fakeClinic);
  });

  it("returns null when no rows match", async () => {
    _selectResult = [];

    const result = await findClinicById("not-found");

    expect(result).toBeNull();
  });
});

// ── listClinics ───────────────────────────────────────────────────────────────

describe("listClinics", () => {
  it("runs without combining conditions when no filters are provided", async () => {
    _selectResult = [];
    await listClinics({});

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockAnd).not.toHaveBeenCalled();
  });

  it("applies state equality filter", async () => {
    _selectResult = [];
    await listClinics({ state: "CA" });

    expect(mockEq).toHaveBeenCalledWith("clinicsTable.state", "CA");
  });

  it("applies city ilike filter", async () => {
    _selectResult = [];
    await listClinics({ city: "Austin" });

    expect(mockIlike).toHaveBeenCalledWith("clinicsTable.city", "Austin");
  });

  it("wraps search value with wildcards", async () => {
    _selectResult = [];
    await listClinics({ search: "care" });

    expect(mockIlike).toHaveBeenCalledWith("clinicsTable.name", "%care%");
  });

  it("combines all filters using and()", async () => {
    _selectResult = [];
    await listClinics({ state: "TX", city: "Houston", search: "urgent" });

    expect(mockEq).toHaveBeenCalledWith("clinicsTable.state", "TX");
    expect(mockIlike).toHaveBeenCalledWith("clinicsTable.city", "Houston");
    expect(mockIlike).toHaveBeenCalledWith("clinicsTable.name", "%urgent%");
    expect(mockAnd).toHaveBeenCalled();
  });

  it("returns rows from the database", async () => {
    const fakeClinics = [{ id: "c1", name: "A" }];
    _selectResult = fakeClinics;

    const result = await listClinics({});

    expect(result).toEqual(fakeClinics);
  });
});

// ── createWaitTimeReport ──────────────────────────────────────────────────────

describe("createWaitTimeReport", () => {
  it("inserts with correct field values and returns the report", async () => {
    const fakeReport = {
      id: "r1",
      clinicId: "c1",
      peopleCount: 3,
      source: "SMS",
      visitReason: null,
      reportedByPhone: null,
      createdAt: new Date(),
    };
    mockReturning.mockResolvedValueOnce([fakeReport]);

    const result = await createWaitTimeReport({
      clinicId: "c1",
      peopleCount: 3,
      source: "SMS",
      visitReason: null,
      reportedByPhone: null,
    });

    expect(mockInsert).toHaveBeenCalledOnce();
    expect(mockValues).toHaveBeenCalledOnce();
    const vals = _insertValues as Record<string, unknown>;
    expect(vals.clinicId).toBe("c1");
    expect(vals.peopleCount).toBe(3);
    expect(vals.source).toBe("SMS");
    expect(vals.visitReason).toBeNull();
    expect(vals.reportedByPhone).toBeNull();
    expect(typeof vals.id).toBe("string");
    expect(result).toEqual(fakeReport);
  });
});

// ── countRecentReports ────────────────────────────────────────────────────────

describe("countRecentReports", () => {
  it("filters by phoneHash and windowStart, returns numeric count", async () => {
    _selectResult = [{ count: 3 }];
    const windowStart = new Date("2026-04-25T00:00:00Z");

    const result = await countRecentReports("abc123", windowStart);

    expect(mockEq).toHaveBeenCalledWith("waitingRoomReportsTable.reportedByPhone", "abc123");
    expect(mockGte).toHaveBeenCalledWith("waitingRoomReportsTable.createdAt", windowStart);
    expect(result).toBe(3);
  });

  it("returns 0 when no rows are found", async () => {
    _selectResult = [];

    const result = await countRecentReports("xyz", new Date());

    expect(result).toBe(0);
  });
});

// ── upsertUserByEmail ─────────────────────────────────────────────────────────

describe("upsertUserByEmail", () => {
  it("inserts user and uses onConflictDoUpdate, returns id", async () => {
    mockReturning.mockResolvedValueOnce([{ id: "u1" }]);

    const result = await upsertUserByEmail("test@example.com");

    expect(mockInsert).toHaveBeenCalledOnce();
    const vals = _insertValues as Record<string, unknown>;
    expect(vals.email).toBe("test@example.com");
    expect(vals.name).toBe("Patient");
    expect(typeof vals.id).toBe("string");
    expect(mockOnConflict).toHaveBeenCalledOnce();
    expect(result).toEqual({ id: "u1" });
  });
});

// ── createReview ──────────────────────────────────────────────────────────────

describe("createReview", () => {
  it("inserts review with all fields and returns it", async () => {
    const fakeReview = {
      id: "rv1",
      clinicId: "c1",
      userId: "u1",
      rating: 5,
      body: "Great!",
      createdAt: new Date(),
    };
    mockReturning.mockResolvedValueOnce([fakeReview]);

    const result = await createReview({ clinicId: "c1", userId: "u1", rating: 5, body: "Great!" });

    expect(mockInsert).toHaveBeenCalledOnce();
    const vals = _insertValues as Record<string, unknown>;
    expect(vals.clinicId).toBe("c1");
    expect(vals.userId).toBe("u1");
    expect(vals.rating).toBe(5);
    expect(vals.body).toBe("Great!");
    expect(typeof vals.id).toBe("string");
    expect(result).toEqual(fakeReview);
  });
});
