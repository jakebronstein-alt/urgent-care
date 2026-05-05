import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ClinicCard, ClinicCardData } from "@/components/clinic/ClinicCard";
import { calculateWaitTime, estimateWaitTime, ClinicCapacity, ReportSource, REPORT_STALE_HOURS } from "@/lib/wait-time";
import { parseHours, isClinicOpen } from "@/lib/hours";
import { SymptomCheckerCTA } from "@/components/clinic/SymptomCheckerCTA";
import { ServiceFilter } from "@/components/clinic/ServiceFilter";
import { MapPin } from "lucide-react";
import { Suspense } from "react";

// Cache city pages for 5 minutes — clinic lists change rarely
export const revalidate = 300;

interface Props {
  params: Promise<{ stateSlug: string; citySlug: string }>;
  searchParams: Promise<{ service?: string }>;
}

function formatCityName(slug: string) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatStateName(slug: string) {
  return slug.toUpperCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug, citySlug } = await params;
  const city = formatCityName(citySlug);
  const state = formatStateName(stateSlug);
  return {
    title: `Urgent Care in ${city}, ${state} — Live Wait Times`,
    description: `Compare live wait times at urgent care clinics in ${city}, ${state}. See how many people are in line before you leave home — X-Ray, COVID Testing & more. No appointment needed.`,
  };
}

export default async function CityPage({ params, searchParams }: Props) {
  const { stateSlug, citySlug } = await params;
  const { service: activeService } = await searchParams;
  const city = formatCityName(citySlug);
  const state = formatStateName(stateSlug);

  let clinics;
  try {
    clinics = await prisma.clinic.findMany({
      where: {
        stateSlug,
        citySlug,
        ...(activeService ? { services: { has: activeService } } : {}),
      },
      include: {
        waitReports: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        waitSettings: true,
        reviews: { select: { rating: true } },
      },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error(`[city-page] Failed to load clinics for ${stateSlug}/${citySlug}:`, err);
    return (
      <main className="min-h-screen bg-white">
        <section className="bg-ubie-blue-light border-b border-ubie-blue/10 px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/urgent-care" className="hover:text-ubie-blue">Urgent Care</Link>
              <span>/</span>
              <a href={`/urgent-care/${stateSlug}`} className="hover:text-ubie-blue">{state}</a>
              <span>/</span>
              <span className="text-ubie-dark font-medium">{city}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ubie-dark">
              Urgent Care in {city}, {state}
            </h1>
          </div>
        </section>
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
            <p className="text-ubie-dark font-medium text-lg leading-snug">Service temporarily unavailable</p>
            <p className="text-gray-500 text-sm mt-2">
              We&apos;re having trouble loading clinic data right now. Please try again in a moment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const now = new Date();

  // One aggregate query for historical averages across all clinics on this page
  const clinicIds = clinics.map((c) => c.id);
  const historicalMap = new Map<string, number | null>();
  try {
    if (clinicIds.length > 0) {
      const historicalGroups = await prisma.waitingRoomReport.groupBy({
        by: ["clinicId"],
        where: { clinicId: { in: clinicIds } },
        _avg: { peopleCount: true },
      });
      for (const h of historicalGroups) {
        historicalMap.set(h.clinicId, h._avg.peopleCount ?? null);
      }
    }
  } catch (err) {
    console.error(`[city-page] Failed to load historical wait data for ${stateSlug}/${citySlug}:`, err);
  }

  const clinicCards: ClinicCardData[] = clinics.map((c) => {
    const latestReport = c.waitReports[0];
    const avg = c.waitSettings?.avgMinutesPerPatient ?? 20;
    const reportAgeHours = latestReport
      ? (now.getTime() - latestReport.createdAt.getTime()) / 3_600_000
      : Infinity;
    const hasLiveReport = latestReport && reportAgeHours < REPORT_STALE_HOURS;
    const waitEstimate = hasLiveReport
      ? calculateWaitTime(latestReport!.peopleCount, latestReport!.createdAt, latestReport!.source as ReportSource, c.capacity as ClinicCapacity, avg)
      : estimateWaitTime({
          clinicId: c.id,
          citySlug: c.citySlug,
          capacity: c.capacity as ClinicCapacity,
          reviewCount: c.reviews.length,
          historicalAvgPeople: historicalMap.get(c.id) ?? null,
          avgMinutesPerPatient: avg,
          now,
        });

    const ratings = c.reviews.map((r) => r.rating);
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;

    const hours = parseHours(c.hours);
    const isClosed = hours ? !isClinicOpen(hours, now) : undefined;

    return {
      id: c.id,
      name: c.name,
      streetAddress: c.streetAddress,
      city: c.city,
      state: c.state,
      zip: c.zip,
      phone: c.phone,
      stateSlug: c.stateSlug,
      citySlug: c.citySlug,
      addressSlug: c.addressSlug,
      clinicSlug: c.clinicSlug,
      avgRating,
      reviewCount: ratings.length,
      waitEstimate,
      isClosed,
    };
  });

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-ubie-blue-light border-b border-ubie-blue/10 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/urgent-care" className="hover:text-ubie-blue">Urgent Care</Link>
            <span>/</span>
            <a href={`/urgent-care/${stateSlug}`} className="hover:text-ubie-blue">{state}</a>
            <span>/</span>
            <span className="text-ubie-dark font-medium">{city}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ubie-dark">
            Urgent Care in {city}, {state}
          </h1>
          <p className="mt-1 text-gray-500 flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {clinicCards.length > 0
              ? `${clinicCards.length} clinic${clinicCards.length !== 1 ? "s" : ""} found${activeService ? ` offering ${activeService}` : ""}`
              : activeService ? `No clinics offering ${activeService} in ${city}` : "No clinics listed yet"}
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Service filter */}
        <Suspense>
          <ServiceFilter mode="filter" activeService={activeService ?? null} />
        </Suspense>

        {/* Clinic list */}
        {clinicCards.length > 0 ? (
          <div className="space-y-3">
            {clinicCards.map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-medium text-ubie-dark">No clinics listed yet</p>
            <p className="text-sm mt-1">We&apos;re adding clinics in {city} soon. Check back shortly.</p>
          </div>
        )}

        {/* Symptom checker */}
        <SymptomCheckerCTA />
      </div>
    </main>
  );
}
