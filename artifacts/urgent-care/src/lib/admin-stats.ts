import { prisma } from "@/lib/db";

export interface ClinicRow {
  clinicId: string;
  name: string;
  city: string;
  state: string;
  h24: number;
  d7: number;
  d30: number;
}

export interface AdminStats {
  totalClinics: number;
  claimsByStatus: Record<string, number>;
  pageViewsPerClinic: ClinicRow[];
  waitReportsPerClinic: ClinicRow[];
  generatedAt: string;
}

export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const start30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    allClinics,
    claimStatuses,
    pv24h,
    pv7d,
    pv30d,
    wr24h,
    wr7d,
    wr30d,
  ] = await Promise.all([
    prisma.clinic.findMany({
      select: { id: true, name: true, city: true, state: true },
      orderBy: { name: "asc" },
    }),
    prisma.claimRequest.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.pageView.groupBy({
      by: ["clinicId"],
      _count: { clinicId: true },
      where: { createdAt: { gte: start24h } },
    }),
    prisma.pageView.groupBy({
      by: ["clinicId"],
      _count: { clinicId: true },
      where: { createdAt: { gte: start7d } },
    }),
    prisma.pageView.groupBy({
      by: ["clinicId"],
      _count: { clinicId: true },
      where: { createdAt: { gte: start30d } },
    }),
    prisma.waitingRoomReport.groupBy({
      by: ["clinicId"],
      _count: { clinicId: true },
      where: { createdAt: { gte: start24h } },
    }),
    prisma.waitingRoomReport.groupBy({
      by: ["clinicId"],
      _count: { clinicId: true },
      where: { createdAt: { gte: start7d } },
    }),
    prisma.waitingRoomReport.groupBy({
      by: ["clinicId"],
      _count: { clinicId: true },
      where: { createdAt: { gte: start30d } },
    }),
  ]);

  const toMap = (rows: { clinicId: string; _count: { clinicId: number } }[]) =>
    new Map(rows.map((r) => [r.clinicId, r._count.clinicId]));

  const pv24Map = toMap(pv24h);
  const pv7Map = toMap(pv7d);
  const pv30Map = toMap(pv30d);
  const wr24Map = toMap(wr24h);
  const wr7Map = toMap(wr7d);
  const wr30Map = toMap(wr30d);

  const pageViewsPerClinic: ClinicRow[] = allClinics.map((c) => ({
    clinicId: c.id,
    name: c.name,
    city: c.city,
    state: c.state,
    h24: pv24Map.get(c.id) ?? 0,
    d7: pv7Map.get(c.id) ?? 0,
    d30: pv30Map.get(c.id) ?? 0,
  }));

  const waitReportsPerClinic: ClinicRow[] = allClinics.map((c) => ({
    clinicId: c.id,
    name: c.name,
    city: c.city,
    state: c.state,
    h24: wr24Map.get(c.id) ?? 0,
    d7: wr7Map.get(c.id) ?? 0,
    d30: wr30Map.get(c.id) ?? 0,
  }));

  const claimsByStatus: Record<string, number> = {};
  for (const row of claimStatuses) {
    claimsByStatus[row.status] = row._count.status;
  }

  return {
    totalClinics: allClinics.length,
    claimsByStatus,
    pageViewsPerClinic,
    waitReportsPerClinic,
    generatedAt: now.toISOString(),
  };
}
