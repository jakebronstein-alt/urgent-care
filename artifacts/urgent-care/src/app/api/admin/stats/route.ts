import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  const startOf24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const startOf7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOf30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalClinics,
    claimedClinics,
    pendingClaimRequests,
    pageViews24h,
    pageViews7d,
    pageViews30d,
    waitReports24h,
    waitReports7d,
    topClinicsByViews,
    recentClaimRequests,
    totalUsers,
    newUsers7d,
    outOfAreaSearches7d,
  ] = await Promise.all([
    prisma.clinic.count(),
    prisma.clinic.count({ where: { isClaimed: true } }),
    prisma.claimRequest.count({ where: { status: "PENDING" } }),
    prisma.pageView.count({ where: { createdAt: { gte: startOf24h } } }),
    prisma.pageView.count({ where: { createdAt: { gte: startOf7d } } }),
    prisma.pageView.count({ where: { createdAt: { gte: startOf30d } } }),
    prisma.waitingRoomReport.count({ where: { createdAt: { gte: startOf24h } } }),
    prisma.waitingRoomReport.count({ where: { createdAt: { gte: startOf7d } } }),
    prisma.pageView.groupBy({
      by: ["clinicId"],
      _count: { clinicId: true },
      where: { createdAt: { gte: startOf7d } },
      orderBy: { _count: { clinicId: "desc" } },
      take: 10,
    }),
    prisma.claimRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        clinic: { select: { name: true, city: true, state: true, stateSlug: true, citySlug: true, addressSlug: true, clinicSlug: true } },
      },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOf7d } } }),
    prisma.outOfAreaSearch.count({ where: { createdAt: { gte: startOf7d } } }),
  ]);

  // Resolve clinic names for top clinics
  const clinicIds = topClinicsByViews.map((r) => r.clinicId);
  const clinicNames = await prisma.clinic.findMany({
    where: { id: { in: clinicIds } },
    select: { id: true, name: true, city: true, state: true, stateSlug: true, citySlug: true, addressSlug: true, clinicSlug: true },
  });
  const clinicMap = Object.fromEntries(clinicNames.map((c) => [c.id, c]));

  const topClinics = topClinicsByViews.map((r) => ({
    clinic: clinicMap[r.clinicId],
    views: r._count.clinicId,
  }));

  return NextResponse.json({
    clinics: {
      total: totalClinics,
      claimed: claimedClinics,
      unclaimedRate: totalClinics > 0 ? ((totalClinics - claimedClinics) / totalClinics * 100).toFixed(1) : "0",
    },
    pageViews: {
      last24h: pageViews24h,
      last7d: pageViews7d,
      last30d: pageViews30d,
    },
    waitReports: {
      last24h: waitReports24h,
      last7d: waitReports7d,
    },
    claims: {
      pending: pendingClaimRequests,
      recent: recentClaimRequests,
    },
    users: {
      total: totalUsers,
      newLast7d: newUsers7d,
    },
    outOfAreaSearches7d,
    topClinics,
    generatedAt: now.toISOString(),
  });
}
