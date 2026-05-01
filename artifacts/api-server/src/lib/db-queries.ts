import { db, eq, ilike, and, gte, count, sql } from "@workspace/db";
import {
  clinicsTable,
  usersTable,
  reviewsTable,
  waitingRoomReportsTable,
  waitReportSourceEnum,
  followUpRequestsTable,
} from "@workspace/db";
import { randomUUID } from "node:crypto";

type WaitReportSource = (typeof waitReportSourceEnum.enumValues)[number];

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
  source: WaitReportSource;
  visitReason: string | null;
  reportedByPhone: string | null;
  createdAt: Date;
}

export interface Review {
  id: string;
  clinicId: string;
  userId: string;
  rating: number;
  body: string | null;
  createdAt: Date;
}

export interface UpsertUserResult {
  id: string;
}

const clinicFields = {
  id: clinicsTable.id,
  name: clinicsTable.name,
  city: clinicsTable.city,
  state: clinicsTable.state,
  address: clinicsTable.address,
  phone: clinicsTable.phone,
  isClaimed: clinicsTable.isClaimed,
} as const;

export async function findClinicById(id: string): Promise<Clinic | null> {
  const rows = await db
    .select(clinicFields)
    .from(clinicsTable)
    .where(eq(clinicsTable.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listClinics(params: {
  state?: string;
  city?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Clinic[]> {
  const { state, city, search, limit = 20, offset = 0 } = params;

  const conditions = [];
  if (state) conditions.push(eq(clinicsTable.state, state));
  if (city) conditions.push(ilike(clinicsTable.city, city));
  if (search) conditions.push(ilike(clinicsTable.name, `%${search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select(clinicFields)
    .from(clinicsTable)
    .where(whereClause)
    .orderBy(clinicsTable.name)
    .limit(limit)
    .offset(offset);
}

export async function createWaitTimeReport(data: {
  clinicId: string;
  peopleCount: number;
  source: WaitReportSource;
  visitReason: string | null;
  reportedByPhone: string | null;
}): Promise<WaitTimeReport> {
  const rows = await db
    .insert(waitingRoomReportsTable)
    .values({
      id: randomUUID(),
      clinicId: data.clinicId,
      peopleCount: data.peopleCount,
      source: data.source,
      visitReason: data.visitReason,
      reportedByPhone: data.reportedByPhone,
      createdAt: new Date(),
    })
    .returning({
      id: waitingRoomReportsTable.id,
      clinicId: waitingRoomReportsTable.clinicId,
      peopleCount: waitingRoomReportsTable.peopleCount,
      source: waitingRoomReportsTable.source,
      visitReason: waitingRoomReportsTable.visitReason,
      reportedByPhone: waitingRoomReportsTable.reportedByPhone,
      createdAt: waitingRoomReportsTable.createdAt,
    });
  return rows[0];
}

export async function countRecentReports(phoneHash: string, windowStart: Date): Promise<number> {
  const rows = await db
    .select({ count: count() })
    .from(waitingRoomReportsTable)
    .where(
      and(
        eq(waitingRoomReportsTable.reportedByPhone, phoneHash),
        gte(waitingRoomReportsTable.createdAt, windowStart),
      ),
    );
  return rows[0]?.count ?? 0;
}

export async function upsertUserByEmail(email: string): Promise<UpsertUserResult> {
  const rows = await db
    .insert(usersTable)
    .values({
      id: randomUUID(),
      email,
      name: "Patient",
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: usersTable.email,
      set: { email: sql`excluded.email` },
    })
    .returning({ id: usersTable.id });
  return rows[0];
}

export interface FollowUpResult {
  id: string;
  reportId: string;
  clinicId: string;
  phone: string;
  visitReason: string | null;
  optedIn: boolean;
  createdAt: Date;
}

export async function upsertFollowUpRequest(data: {
  reportId: string;
  clinicId: string;
  phone: string;
  visitReason?: string | null;
  optedIn?: boolean;
}): Promise<FollowUpResult> {
  const rows = await db
    .insert(followUpRequestsTable)
    .values({
      id: randomUUID(),
      reportId: data.reportId,
      clinicId: data.clinicId,
      phone: data.phone,
      visitReason: data.visitReason ?? null,
      optedIn: data.optedIn === true,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: followUpRequestsTable.reportId,
      set: {
        visitReason: sql`excluded."visitReason"`,
        optedIn: sql`excluded."optedIn"`,
      },
    })
    .returning({
      id: followUpRequestsTable.id,
      reportId: followUpRequestsTable.reportId,
      clinicId: followUpRequestsTable.clinicId,
      phone: followUpRequestsTable.phone,
      visitReason: followUpRequestsTable.visitReason,
      optedIn: followUpRequestsTable.optedIn,
      createdAt: followUpRequestsTable.createdAt,
    });
  return rows[0];
}

export async function createReview(data: {
  clinicId: string;
  userId: string;
  rating: number;
  body: string;
}): Promise<Review> {
  const rows = await db
    .insert(reviewsTable)
    .values({
      id: randomUUID(),
      clinicId: data.clinicId,
      userId: data.userId,
      rating: data.rating,
      body: data.body,
      createdAt: new Date(),
    })
    .returning({
      id: reviewsTable.id,
      clinicId: reviewsTable.clinicId,
      userId: reviewsTable.userId,
      rating: reviewsTable.rating,
      body: reviewsTable.body,
      createdAt: reviewsTable.createdAt,
    });
  return rows[0];
}
