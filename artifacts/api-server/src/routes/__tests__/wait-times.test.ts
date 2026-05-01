import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app";

vi.mock("../../lib/db-queries", () => ({
  findClinicById: vi.fn(),
  listClinics: vi.fn(),
  createWaitTimeReport: vi.fn(),
  countRecentReports: vi.fn(),
  upsertUserByEmail: vi.fn(),
  createReview: vi.fn(),
}));

import * as dbQueries from "../../lib/db-queries";

const mockClinic = {
  id: "clinic-abc",
  name: "Fast Care",
  city: "Denver",
  state: "CO",
  address: "10 Oak Ave",
  phone: "303-555-0000",
  isClaimed: true,
};

import type { WaitTimeReport } from "../../lib/db-queries";

const mockReport: WaitTimeReport = {
  id: "report-1",
  clinicId: "clinic-abc",
  peopleCount: 3,
  source: "CROWDSOURCED_WEB",
  visitReason: null,
  reportedByPhone: null,
  createdAt: new Date("2026-04-25T12:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/wait-times", () => {
  it("returns 201 with reportId on success (no phone)", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(mockClinic);
    vi.mocked(dbQueries.createWaitTimeReport).mockResolvedValue(mockReport);

    const res = await request(app).post("/api/wait-times").send({
      clinicId: "clinic-abc",
      peopleCount: 3,
      source: "CROWDSOURCED_WEB",
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, reportId: "report-1" });
    expect(dbQueries.countRecentReports).not.toHaveBeenCalled();
  });

  it("returns 201 and checks rate limit when phone is provided", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(mockClinic);
    vi.mocked(dbQueries.countRecentReports).mockResolvedValue(2);
    vi.mocked(dbQueries.createWaitTimeReport).mockResolvedValue({
      ...mockReport,
      reportedByPhone: "a1b2c3d4",
    });

    const res = await request(app).post("/api/wait-times").send({
      clinicId: "clinic-abc",
      peopleCount: 1,
      source: "CROWDSOURCED_WEB",
      phone: "3035550000",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(dbQueries.countRecentReports).toHaveBeenCalledOnce();
  });

  it("returns 400 when clinicId is missing", async () => {
    const res = await request(app).post("/api/wait-times").send({
      peopleCount: 2,
      source: "CROWDSOURCED_WEB",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/clinicId/);
  });

  it("returns 400 when peopleCount is not a number", async () => {
    const res = await request(app).post("/api/wait-times").send({
      clinicId: "clinic-abc",
      peopleCount: "many",
      source: "CROWDSOURCED_WEB",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/peopleCount/);
  });

  it("returns 400 when peopleCount is negative", async () => {
    const res = await request(app).post("/api/wait-times").send({
      clinicId: "clinic-abc",
      peopleCount: -1,
      source: "CROWDSOURCED_WEB",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/peopleCount/);
  });

  it("returns 400 for invalid source", async () => {
    const res = await request(app).post("/api/wait-times").send({
      clinicId: "clinic-abc",
      peopleCount: 2,
      source: "INVALID_SOURCE",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid source/);
  });

  it("returns 400 when source is missing", async () => {
    const res = await request(app).post("/api/wait-times").send({
      clinicId: "clinic-abc",
      peopleCount: 2,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid source/);
  });

  it("returns 404 when clinic does not exist", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(null);

    const res = await request(app).post("/api/wait-times").send({
      clinicId: "nonexistent",
      peopleCount: 2,
      source: "CROWDSOURCED_WEB",
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Clinic not found");
  });

  it("returns 429 when rate limit exceeded", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(mockClinic);
    vi.mocked(dbQueries.countRecentReports).mockResolvedValue(5);

    const res = await request(app).post("/api/wait-times").send({
      clinicId: "clinic-abc",
      peopleCount: 1,
      source: "CROWDSOURCED_WEB",
      phone: "3035550000",
    });

    expect(res.status).toBe(429);
    expect(res.body.error).toBe("rate_limited");
    expect(dbQueries.createWaitTimeReport).not.toHaveBeenCalled();
  });

  it("returns 500 when clinic lookup throws", async () => {
    vi.mocked(dbQueries.findClinicById).mockRejectedValue(new Error("db timeout"));

    const res = await request(app).post("/api/wait-times").send({
      clinicId: "clinic-abc",
      peopleCount: 2,
      source: "CROWDSOURCED_WEB",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/db timeout/);
  });

  it("returns 500 when rate limit check throws", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(mockClinic);
    vi.mocked(dbQueries.countRecentReports).mockRejectedValue(new Error("query failed"));

    const res = await request(app).post("/api/wait-times").send({
      clinicId: "clinic-abc",
      peopleCount: 2,
      source: "CROWDSOURCED_WEB",
      phone: "3035550000",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/query failed/);
  });

  it("returns 500 when report creation throws", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(mockClinic);
    vi.mocked(dbQueries.createWaitTimeReport).mockRejectedValue(new Error("insert failed"));

    const res = await request(app).post("/api/wait-times").send({
      clinicId: "clinic-abc",
      peopleCount: 2,
      source: "SMS",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/insert failed/);
  });

  it("accepts all valid source values", async () => {
    const validSources = ["CROWDSOURCED_WEB", "CLINIC_DASHBOARD", "SMS"] as const;

    for (const source of validSources) {
      vi.mocked(dbQueries.findClinicById).mockResolvedValue(mockClinic);
      vi.mocked(dbQueries.createWaitTimeReport).mockResolvedValue({ ...mockReport, source });

      const res = await request(app).post("/api/wait-times").send({
        clinicId: "clinic-abc",
        peopleCount: 1,
        source,
      });

      expect(res.status, `source=${source}`).toBe(201);
    }
  });
});
