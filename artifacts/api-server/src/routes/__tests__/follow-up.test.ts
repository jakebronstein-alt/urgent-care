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
  upsertFollowUpRequest: vi.fn(),
}));

import * as dbQueries from "../../lib/db-queries";

const mockFollowUpResult = {
  id: "fu-1",
  reportId: "report-abc",
  clinicId: "clinic-xyz",
  phone: "5125550099",
  visitReason: "Sore throat",
  optedIn: true,
  createdAt: new Date("2026-04-25T10:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/follow-up", () => {
  it("returns 200 on successful upsert", async () => {
    vi.mocked(dbQueries.upsertFollowUpRequest).mockResolvedValue(mockFollowUpResult);

    const res = await request(app).post("/api/follow-up").send({
      reportId: "report-abc",
      clinicId: "clinic-xyz",
      phone: "5125550099",
      visitReason: "Sore throat",
      optedIn: true,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("passes all fields through to upsertFollowUpRequest", async () => {
    vi.mocked(dbQueries.upsertFollowUpRequest).mockResolvedValue(mockFollowUpResult);

    await request(app).post("/api/follow-up").send({
      reportId: "report-abc",
      clinicId: "clinic-xyz",
      phone: "5125550099",
      visitReason: "Sore throat",
      optedIn: true,
    });

    expect(dbQueries.upsertFollowUpRequest).toHaveBeenCalledWith({
      reportId: "report-abc",
      clinicId: "clinic-xyz",
      phone: "5125550099",
      visitReason: "Sore throat",
      optedIn: true,
    });
  });

  it("defaults optedIn to false when not provided", async () => {
    vi.mocked(dbQueries.upsertFollowUpRequest).mockResolvedValue({
      ...mockFollowUpResult,
      optedIn: false,
      visitReason: null,
    });

    await request(app).post("/api/follow-up").send({
      reportId: "report-abc",
      clinicId: "clinic-xyz",
      phone: "5125550099",
    });

    expect(dbQueries.upsertFollowUpRequest).toHaveBeenCalledWith(
      expect.objectContaining({ optedIn: false, visitReason: null }),
    );
  });

  it("returns 400 when reportId is missing", async () => {
    const res = await request(app).post("/api/follow-up").send({
      clinicId: "clinic-xyz",
      phone: "5125550099",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  it("returns 400 when clinicId is missing", async () => {
    const res = await request(app).post("/api/follow-up").send({
      reportId: "report-abc",
      phone: "5125550099",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  it("returns 400 when phone is missing", async () => {
    const res = await request(app).post("/api/follow-up").send({
      reportId: "report-abc",
      clinicId: "clinic-xyz",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  it("returns 500 when upsertFollowUpRequest throws", async () => {
    vi.mocked(dbQueries.upsertFollowUpRequest).mockRejectedValue(new Error("connection lost"));

    const res = await request(app).post("/api/follow-up").send({
      reportId: "report-abc",
      clinicId: "clinic-xyz",
      phone: "5125550099",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/connection lost/);
  });

  it("succeeds without optional visitReason field", async () => {
    vi.mocked(dbQueries.upsertFollowUpRequest).mockResolvedValue({
      ...mockFollowUpResult,
      visitReason: null,
    });

    const res = await request(app).post("/api/follow-up").send({
      reportId: "report-abc",
      clinicId: "clinic-xyz",
      phone: "5125550099",
      optedIn: false,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});
