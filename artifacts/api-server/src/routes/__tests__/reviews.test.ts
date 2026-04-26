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
  id: "clinic-xyz",
  name: "Sunrise Urgent Care",
  city: "Austin",
  state: "TX",
  address: "99 Elm St",
  phone: "512-555-0099",
  isClaimed: false,
};

const mockUser = { id: "user-111" };

const mockReview = {
  id: "review-1",
  clinicId: "clinic-xyz",
  userId: "user-111",
  rating: 4,
  body: "Very friendly staff.",
  createdAt: new Date("2026-04-25T10:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/reviews", () => {
  it("returns 201 on successful review submission", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(mockClinic);
    vi.mocked(dbQueries.upsertUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(dbQueries.createReview).mockResolvedValue(mockReview);

    const res = await request(app).post("/api/reviews").send({
      clinicId: "clinic-xyz",
      phone: "5125550099",
      rating: 4,
      body: "Very friendly staff.",
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true });
  });

  it("creates a synthetic email from phone digits", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(mockClinic);
    vi.mocked(dbQueries.upsertUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(dbQueries.createReview).mockResolvedValue(mockReview);

    await request(app).post("/api/reviews").send({
      clinicId: "clinic-xyz",
      phone: "(512) 555-0099",
      rating: 5,
      body: "Great place!",
    });

    expect(dbQueries.upsertUserByEmail).toHaveBeenCalledWith("5125550099@phone.ubiehealth");
  });

  it("returns 400 when clinicId is missing", async () => {
    const res = await request(app).post("/api/reviews").send({
      phone: "5125550099",
      rating: 4,
      body: "Good.",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  it("returns 400 when phone is missing", async () => {
    const res = await request(app).post("/api/reviews").send({
      clinicId: "clinic-xyz",
      rating: 4,
      body: "Good.",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  it("returns 400 when rating is missing", async () => {
    const res = await request(app).post("/api/reviews").send({
      clinicId: "clinic-xyz",
      phone: "5125550099",
      body: "Good.",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  it("returns 400 when body is missing", async () => {
    const res = await request(app).post("/api/reviews").send({
      clinicId: "clinic-xyz",
      phone: "5125550099",
      rating: 3,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  it("returns 400 when rating is below 1", async () => {
    const res = await request(app).post("/api/reviews").send({
      clinicId: "clinic-xyz",
      phone: "5125550099",
      rating: 0,
      body: "Terrible.",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Rating must be between 1 and 5");
  });

  it("returns 400 when rating is above 5", async () => {
    const res = await request(app).post("/api/reviews").send({
      clinicId: "clinic-xyz",
      phone: "5125550099",
      rating: 6,
      body: "Amazing.",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Rating must be between 1 and 5");
  });

  it("returns 400 when phone number has fewer than 10 digits", async () => {
    const res = await request(app).post("/api/reviews").send({
      clinicId: "clinic-xyz",
      phone: "12345",
      rating: 4,
      body: "Decent.",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid phone number");
  });

  it("returns 404 when clinic does not exist", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(null);

    const res = await request(app).post("/api/reviews").send({
      clinicId: "nonexistent",
      phone: "5125550099",
      rating: 3,
      body: "OK.",
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Clinic not found");
  });

  it("returns 409 when user has already reviewed the clinic", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(mockClinic);
    vi.mocked(dbQueries.upsertUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(dbQueries.createReview).mockRejectedValue(new Error("unique constraint violation"));

    const res = await request(app).post("/api/reviews").send({
      clinicId: "clinic-xyz",
      phone: "5125550099",
      rating: 4,
      body: "Second review attempt.",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("You've already reviewed this clinic.");
  });

  it("returns 500 when clinic lookup throws", async () => {
    vi.mocked(dbQueries.findClinicById).mockRejectedValue(new Error("connection lost"));

    const res = await request(app).post("/api/reviews").send({
      clinicId: "clinic-xyz",
      phone: "5125550099",
      rating: 4,
      body: "Good.",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/connection lost/);
  });

  it("returns 500 on unexpected DB error during review creation", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(mockClinic);
    vi.mocked(dbQueries.upsertUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(dbQueries.createReview).mockRejectedValue(new Error("disk full"));

    const res = await request(app).post("/api/reviews").send({
      clinicId: "clinic-xyz",
      phone: "5125550099",
      rating: 2,
      body: "Mediocre experience.",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/disk full/);
  });

  it("accepts rating as a string that coerces to a valid number", async () => {
    vi.mocked(dbQueries.findClinicById).mockResolvedValue(mockClinic);
    vi.mocked(dbQueries.upsertUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(dbQueries.createReview).mockResolvedValue({ ...mockReview, rating: 5 });

    const res = await request(app).post("/api/reviews").send({
      clinicId: "clinic-xyz",
      phone: "5125550099",
      rating: "5",
      body: "Excellent!",
    });

    expect(res.status).toBe(201);
    expect(dbQueries.createReview).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 5 })
    );
  });
});
