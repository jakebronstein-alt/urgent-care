import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { calculateWaitTime, estimateWaitTime, ClinicCapacity, ReportSource, REPORT_STALE_HOURS } from "@/lib/wait-time";
import { parseHours, isClinicOpen } from "@/lib/hours";
import { ClinicCard, ClinicCardData } from "@/components/clinic/ClinicCard";
import { ServiceFilter } from "@/components/clinic/ServiceFilter";
import { SymptomCheckerCTA } from "@/components/clinic/SymptomCheckerCTA";
import { Suspense } from "react";
import { resolveLocation, BOROUGH_INFO } from "@/lib/nyc-locations";
import Link from "next/link";
import { MapPin } from "lucide-react";

interface Props {
  searchParams: Promise<{ service?: string; q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { service, q } = await searchParams;
  if (q) {
    return {
      title: `Urgent Care Near "${q}" | UbieHealth`,
      description: `Find urgent care clinics near ${q}. See real-time wait times and reviews.`,
    };
  }
  return {
    title: service
      ? `Urgent Care Offering ${service} — NYC Metro | UbieHealth`
      : "Search Urgent Care by Service | UbieHealth",
    description: service
      ? `Find urgent care clinics in the NYC metro area offering ${service}. See real-time wait times and reviews.`
      : "Search NYC metro urgent care clinics by service offered.",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { service: activeService, q } = await searchParams;

  const now = new Date();

  // ── Location search (q=) ───────────────────────────────────────────────────
  if (q && q.trim()) {
    const result = resolveLocation(q.trim());

    if (result.type === "empty") {
      // fall through to default state below (handled by q being falsy effectively)
    } else if (result.type === "out-of-area") {
      // Record the search so we know where to expand next — swallow errors so page always renders
      try {
        await prisma.outOfAreaSearch.create({ data: { query: q.trim() } });
      } catch {
        // non-critical — don't let a DB write block the user-facing response
      }

      return (
        <main className="min-h-screen bg-white">
          <section className="bg-ubie-blue-light border-b border-ubie-blue/10 px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <a href="/urgent-care" className="hover:text-ubie-blue">Urgent Care</a>
                <span>/</span>
                <span className="text-ubie-dark font-medium">Search</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ubie-dark">
                We&apos;re not in {q} yet
              </h1>
            </div>
          </section>

          <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
              <p className="text-ubie-dark font-medium text-lg leading-snug">
                UbieHealth Urgent Care is currently only available in New York City.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                We&apos;ve noted your search and will expand to new areas soon — {q} is on our list!
              </p>
            </div>

            <div>
              <p className="text-base font-semibold text-ubie-dark mb-1">
                Good news — Ubie Consult is available everywhere, right now.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Whether you&apos;re in {q} or anywhere else in the world, Ubie Consult is free to use.
              </p>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg leading-none">🩺</span>
                  <span><strong>Book a local doctor</strong> — find and schedule in-person care near you</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg leading-none">🔍</span>
                  <span><strong>Find possible causes</strong> — enter your symptoms and get a medically validated list of conditions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg leading-none">📊</span>
                  <span><strong>Get a disease prediction</strong> — AI-powered, doctor-approved likelihood scores</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg leading-none">💊</span>
                  <span><strong>OTC solutions &amp; home remedies</strong> — see what you can treat at home right now</span>
                </li>
              </ul>
              <a
                href="https://ubiehealth.com/consult/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-6 rounded-[30px] bg-ubie-blue text-white px-7 py-3 text-sm font-semibold hover:bg-ubie-blue/90 transition-colors shadow-sm"
              >
                Try Ubie Consult — it&apos;s free →
              </a>
              <p className="text-xs text-gray-400 mt-2">Trusted by 13M+ people worldwide</p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-400 mb-3">Meanwhile, browse NYC urgent care:</p>
              <div className="flex flex-wrap gap-2">
                {Object.values(BOROUGH_INFO).map((b) => (
                  <Link
                    key={b.borough}
                    href={`/urgent-care/${b.dbCities[0].stateSlug}/${b.dbCities[0].citySlug}`}
                    className="rounded-full border border-gray-200 px-4 py-1.5 text-sm text-ubie-dark hover:border-ubie-blue hover:text-ubie-blue hover:bg-ubie-blue-light transition-all"
                  >
                    {b.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      );
    } else {
      // result.type === "nyc"
      const { borough, info } = result;

      // Query all clinics in this borough (may span multiple citySlug values, e.g. Queens)
      const orConditions = info.dbCities.map(({ stateSlug, citySlug }) => ({
        stateSlug,
        citySlug,
      }));

      const clinics = await prisma.clinic.findMany({
        where: { OR: orConditions },
        include: {
          waitReports: { orderBy: { createdAt: "desc" }, take: 1 },
          waitSettings: true,
          reviews: { select: { rating: true } },
        },
        orderBy: { name: "asc" },
      });

      const clinicCards: ClinicCardData[] = clinics.map((c) => {
        const latestReport = c.waitReports[0];
        const avg = c.waitSettings?.avgMinutesPerPatient ?? 20;
        const reportAgeHours = latestReport
          ? (Date.now() - latestReport.createdAt.getTime()) / 3_600_000
          : Infinity;
        const hasLiveReport = latestReport && reportAgeHours < REPORT_STALE_HOURS;
        const ratings = c.reviews.map((r) => r.rating);
        const waitEstimate = hasLiveReport
          ? calculateWaitTime(latestReport!.peopleCount, latestReport!.createdAt, latestReport!.source as ReportSource, c.capacity as ClinicCapacity, avg)
          : estimateWaitTime({
              clinicId: c.id,
              citySlug: c.citySlug,
              capacity: c.capacity as ClinicCapacity,
              reviewCount: ratings.length,
              avgMinutesPerPatient: avg,
              now,
            });
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
          <section className="bg-ubie-blue-light border-b border-ubie-blue/10 px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <a href="/urgent-care" className="hover:text-ubie-blue">Urgent Care</a>
                <span>/</span>
                <span className="text-ubie-dark font-medium">{info.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-ubie-blue shrink-0" />
                <h1 className="text-2xl sm:text-3xl font-bold text-ubie-dark">
                  Urgent Care in {info.label}
                </h1>
              </div>
              <p className="mt-1 text-gray-500">
                {clinicCards.length > 0
                  ? `${clinicCards.length} clinic${clinicCards.length !== 1 ? "s" : ""} in ${info.label}`
                  : `No clinics found in ${info.label} yet`}
              </p>
            </div>
          </section>

          <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
            {clinicCards.length > 0 ? (
              clinicCards.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))
            ) : (
              <p className="text-center py-12 text-gray-400">
                No clinics in our directory for {info.label} yet. Check back soon!
              </p>
            )}
            <SymptomCheckerCTA />
          </div>
        </main>
      );
    }
  }

  // ── Service search (service=) or default state ─────────────────────────────
  const clinics = activeService
    ? await prisma.clinic.findMany({
        where: { services: { has: activeService } },
        include: {
          waitReports: { orderBy: { createdAt: "desc" }, take: 1 },
          waitSettings: true,
          reviews: { select: { rating: true } },
        },
        orderBy: [{ state: "asc" }, { city: "asc" }, { name: "asc" }],
      })
    : [];

  const clinicCards: ClinicCardData[] = clinics.map((c) => {
    const latestReport = c.waitReports[0];
    const avg = c.waitSettings?.avgMinutesPerPatient ?? 20;
    const reportAgeHours = latestReport
      ? (Date.now() - latestReport.createdAt.getTime()) / 3_600_000
      : Infinity;
    const hasLiveReport = latestReport && reportAgeHours < REPORT_STALE_HOURS;
    const ratings = c.reviews.map((r) => r.rating);
    const waitEstimate = hasLiveReport
      ? calculateWaitTime(latestReport!.peopleCount, latestReport!.createdAt, latestReport!.source as ReportSource, c.capacity as ClinicCapacity, avg)
      : estimateWaitTime({
          clinicId: c.id,
          citySlug: c.citySlug,
          capacity: c.capacity as ClinicCapacity,
          reviewCount: ratings.length,
          avgMinutesPerPatient: avg,
          now,
        });
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
      <section className="bg-ubie-blue-light border-b border-ubie-blue/10 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <a href="/urgent-care" className="hover:text-ubie-blue">Urgent Care</a>
            <span>/</span>
            <span className="text-ubie-dark font-medium">Search by service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ubie-dark">
            {activeService ? `Clinics offering ${activeService}` : "Search by service"}
          </h1>
          {activeService && (
            <p className="mt-1 text-gray-500">
              {clinicCards.length > 0
                ? `${clinicCards.length} clinic${clinicCards.length !== 1 ? "s" : ""} found across the NYC metro area`
                : "No clinics found for this service"}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Suspense>
          <ServiceFilter mode="search" activeService={activeService ?? null} />
        </Suspense>

        {!activeService && (
          <p className="text-sm text-gray-400 text-center py-6">
            Select a service above to find matching clinics.
          </p>
        )}

        {activeService && clinicCards.length > 0 && (
          <div className="space-y-3">
            {clinicCards.map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} />
            ))}
          </div>
        )}

        {activeService && clinicCards.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-medium text-ubie-dark">No clinics found</p>
            <p className="text-sm mt-1">
              We don&apos;t have any clinics listed offering {activeService} yet. Try a different service.
            </p>
          </div>
        )}

        <SymptomCheckerCTA />
      </div>
    </main>
  );
}
