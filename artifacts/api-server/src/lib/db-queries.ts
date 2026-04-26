import { pool } from "@workspace/db";

export interface Clinic {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string | null;
  phone: string | null;
  isClaimed: boolean;
}

export interface WaitTimeReport {
  id: string;
  clinicId: string;
  peopleCount: number;
  source: string;
  visitReason: string | null;
  reportedByPhone: string | null;
  createdAt: Date;
}

export interface Review {
  id: string;
  clinicId: string;
  userId: string;
  rating: number;
  body: string;
  createdAt: Date;
}

export interface UpsertUserResult {
  id: string;
}

export async function findClinicById(id: string): Promise<Clinic | null> {
  const result = await pool.query<Clinic>(
    `SELECT id, name, city, state, address, phone, "isClaimed"
     FROM clinics
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listClinics(params: {
  state?: string;
  city?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Clinic[]> {
  const { state, city, search, limit = 20, offset = 0 } = params;
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (state) {
    conditions.push(`state = $${idx++}`);
    values.push(state);
  }
  if (city) {
    conditions.push(`city ILIKE $${idx++}`);
    values.push(city);
  }
  if (search) {
    conditions.push(`name ILIKE $${idx++}`);
    values.push(`%${search}%`);
  }

  values.push(limit, offset);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const text = `SELECT id, name, city, state, address, phone, "isClaimed"
                FROM clinics ${where}
                ORDER BY name
                LIMIT $${idx++} OFFSET $${idx++}`;

  const result = await pool.query<Clinic>(text, values);
  return result.rows;
}

export async function createWaitTimeReport(data: {
  clinicId: string;
  peopleCount: number;
  source: string;
  visitReason: string | null;
  reportedByPhone: string | null;
}): Promise<WaitTimeReport> {
  const result = await pool.query<WaitTimeReport>(
    `INSERT INTO waiting_room_reports
       ("clinicId", "peopleCount", source, "visitReason", "reportedByPhone", "createdAt")
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, "clinicId", "peopleCount", source, "visitReason", "reportedByPhone", "createdAt"`,
    [data.clinicId, data.peopleCount, data.source, data.visitReason, data.reportedByPhone]
  );
  return result.rows[0];
}

export async function countRecentReports(phoneHash: string, windowStart: Date): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM waiting_room_reports
     WHERE "reportedByPhone" = $1
       AND "createdAt" >= $2`,
    [phoneHash, windowStart.toISOString()]
  );
  return Number(result.rows[0].count);
}

export async function upsertUserByEmail(email: string): Promise<UpsertUserResult> {
  const result = await pool.query<UpsertUserResult>(
    `INSERT INTO users (email, name, "createdAt", "updatedAt")
     VALUES ($1, 'Patient', NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
     RETURNING id`,
    [email]
  );
  return result.rows[0];
}

export async function createReview(data: {
  clinicId: string;
  userId: string;
  rating: number;
  body: string;
}): Promise<Review> {
  const result = await pool.query<Review>(
    `INSERT INTO reviews ("clinicId", "userId", rating, body, "createdAt")
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, "clinicId", "userId", rating, body, "createdAt"`,
    [data.clinicId, data.userId, data.rating, data.body]
  );
  return result.rows[0];
}
