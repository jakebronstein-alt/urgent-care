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
  id: "clinic-123",
  name: "Quick Care Clinic",
  city: "Springfield",
  state: "IL",
  address: "123 Main St",
  phone: "555-1234",
  isClaimed: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/clinics", () => {
  it("returns 200 with a list of clinics", async () => {
    vi.mocked(dbQueries.listClinics).mockResolvedValue([mockClinic]);

    const res = await request(app).get("/api/clinics");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ clinics: [mockClinic] });
    expect(dbQueries.listClinics).toHaveBeenCalledWith({
      state: undefined,
      city: undefined,
      search: undefined,
      limit: 20,
      offset: 0,
    });
  });

  it("passes query params to listClinics", async () => {
    vi.mocked(dbQueries.listClinics).mockResolvedValue([mockClinic]);

    const res = await request(app)
      .get("/api/clinics")
      .query({ state: "IL", city: "Springfield", search: "Quick", limit: "5", offset: "10" });

    expect(res.status).toBe(200);
    expect(dbQueries.listClinics).toHaveBeenCalledWith({
      state: "IL",
      city: "Springfield",
      search: "Quick",
      limit: 5,
      offset: 10,
    });
  });

  it("returns 200 with empty clinics array when none found", async () => {
    vi.mocked(dbQueries.listClinics).mockResolvedValue([]);

    const res = await request(app).get("/api/clinics");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ clinics: [] });
  });

  it("returns 400 for invalid limit", async () => {
    const res = await request(app).get("/api/clinics").query({ limit: "abc" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid limit/i);
  });

  it("returns 400 for limit greater than 100", async () => {
    const res = await request(app).get("/api/clinics").query({ limit: "200" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid limit/i);
  });

  it("returns 400 for negative offset", async () => {
    const res = await request(app).get("/api/clinics").query({ offset: "-1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid offset/i);
  });

  it("returns 500 when DB throws", async () => {
    vi.mocked(dbQueries.listClinics).mockRejectedValue(new Error("connection refused"));

    const res = await request(app).get("/api/clinics");

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/connection refused/);
  });
});

describe("GET /api/clinics/:id", () => {
  it("returns 200 with the clinic when found", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(mockClinic);

    const res = await request(app).get("/api/clinics/clinic-123");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ clinic: mockClinic });
    expect(dbQueries.findClinicById).toHaveBeenCalledWith("clinic-123");
  });

  it("returns 404 when clinic does not exist", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(null);

    const res = await request(app).get("/api/clinics/unknown-id");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Clinic not found");
  });

  it("returns 500 when DB throws", async () => {
    vi.mocked(dbQueries.findClinicById).mockRejectedValue(new Error("timeout"));

    const res = await request(app).get("/api/clinics/clinic-123");

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/timeout/);
  });
});
