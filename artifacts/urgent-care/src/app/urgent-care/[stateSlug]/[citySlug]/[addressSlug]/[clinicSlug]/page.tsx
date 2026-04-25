import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Phone, Globe, Star, Clock, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { calculateWaitTime, estimateWaitTime, waitSummaryForSEO, ClinicCapacity, ReportSource, REPORT_STALE_HOURS } from "@/lib/wait-time";
import { parseHours, isClinicOpen, nextOpenLabel as getNextOpenLabel } from "@/lib/hours";
import { WaitTimeBadge } from "@/components/clinic/WaitTimeBadge";
import { ClaimBanner } from "@/components/clinic/ClaimBanner";
import { SymptomCheckerCTA } from "@/components/clinic/SymptomCheckerCTA";
import { WriteReviewForm } from "@/components/clinic/WriteReviewForm";
import { ZocDocBanner } from "@/components/clinic/ZocDocBanner";
import { serviceToSlug } from "@/lib/services-info";

interface Props {
  params: Promise<{
    stateSlug: string;
    citySlug: string;
    addressSlug: string;
    clinicSlug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug, citySlug, addressSlug, clinicSlug } = await params;
  const clinic = await prisma.clinic.findUnique({
    where: { stateSlug_citySlug_addressSlug_clinicSlug: { stateSlug, citySlug, addressSlug, clinicSlug } },
    include: {
      waitReports: { orderBy: { createdAt: "desc" }, take: 1 },
      waitSettings: true,
      reviews: { select: { rating: true } },
    },
  });
  if (!clinic) return {};

  const avg = clinic.waitSettings?.avgMinutesPerPatient ?? 20;
  const latestReport = clinic.waitReports[0];
  const metaEstimate = latestReport
    ? calculateWaitTime(latestReport.peopleCount, latestReport.createdAt, latestReport.source as ReportSource, clinic.capacity as ClinicCapacity, avg)
    : estimateWaitTime({ clinicId: clinic.id, citySlug: clinic.citySlug, capacity: clinic.capacity as ClinicCapacity, reviewCount: clinic.reviews.length });

  const waitSummary = waitSummaryForSEO(metaEstimate);
  const ratings = clinic.reviews.map((r) => r.rating);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

  const title = `${clinic.name} Urgent Care — ${waitSummary} | ${clinic.city}, ${clinic.state}`;
  const description = [
    `${clinic.name} at ${clinic.streetAddress}, ${clinic.city}, ${clinic.state}.`,
    waitSummary + ".",
    avgRating ? `Rated ${avgRating}/5 by patients.` : "",
    clinic.services.length ? `Services: ${clinic.services.slice(0, 4).join(", ")}.` : "",
    "Check symptoms, call ahead, and plot your next steps — free on UbieHealth.",
  ].filter(Boolean).join(" ");

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function ClinicDetailPage({ params }: Props) {
  const { stateSlug, citySlug, addressSlug, clinicSlug } = await params;

  const clinic = await prisma.clinic.findUnique({
    where: { stateSlug_citySlug_addressSlug_clinicSlug: { stateSlug, citySlug, addressSlug, clinicSlug } },
    include: {
      waitReports: { orderBy: { createdAt: "desc" }, take: 1 },
      waitSettings: true,
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!clinic) notFound();

  const avg = clinic.waitSettings?.avgMinutesPerPatient ?? 20;
  const latestReport = clinic.waitReports[0];
  const reportAgeHours = latestReport
    ? (Date.now() - latestReport.createdAt.getTime()) / 3_600_000
    : Infinity;
  const hasLiveReport = latestReport && reportAgeHours < REPORT_STALE_HOURS;

  const ratings = clinic.reviews.map((r) => r.rating);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const showSymptomChecker = clinic.waitSettings?.symptomCheckerEnabled ?? true;

  // Open/closed state
  const hours = parseHours(clinic.hours);
  const now = new Date();

  // Historical average for the estimator (all-time, all sources)
  const historicalAgg = await prisma.waitingRoomReport.aggregate({
    where: { clinicId: clinic.id },
    _avg: { peopleCount: true },
  });

  const estimate = hasLiveReport
    ? calculateWaitTime(latestReport!.peopleCount, latestReport!.createdAt, latestReport!.source as ReportSource, clinic.capacity as ClinicCapacity, avg)
    : estimateWaitTime({
        clinicId: clinic.id,
        citySlug: clinic.citySlug,
        capacity: clinic.capacity as ClinicCapacity,
        reviewCount: ratings.length,
        historicalAvgPeople: historicalAgg._avg.peopleCount,
        avgMinutesPerPatient: avg,
        now,
      });
  const isClosed = hours ? !isClinicOpen(hours, now) : false;
  const nextOpen = hours ? getNextOpenLabel(hours, now) : null;

  // Yesterday's average wait (midnight–midnight UTC)
  const startOfYesterday = new Date(now);
  startOfYesterday.setDate(now.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);
  const endOfYesterday = new Date(now);
  endOfYesterday.setDate(now.getDate() - 1);
  endOfYesterday.setHours(23, 59, 59, 999);

  const yesterdayReports = await prisma.waitingRoomReport.findMany({
    where: { clinicId: clinic.id, createdAt: { gte: startOfYesterday, lte: endOfYesterday } },
    select: { peopleCount: true },
  });
  const yesterdayAvgMinutes = yesterdayReports.length > 0
    ? Math.round(
        (yesterdayReports.reduce((sum, r) => sum + r.peopleCount, 0) / yesterdayReports.length) * avg
      )
    : null;

  const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(`${clinic.streetAddress}, ${clinic.city}, ${clinic.state} ${clinic.zip}`)}&output=embed`;
  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${clinic.streetAddress}, ${clinic.city}, ${clinic.state} ${clinic.zip}`)}`;

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "MedicalClinic"],
    name: clinic.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinic.streetAddress,
      addressLocality: clinic.city,
      addressRegion: clinic.state,
      postalCode: clinic.zip,
      addressCountry: "US",
    },
    geo: { "@type": "GeoCoordinates", latitude: clinic.lat, longitude: clinic.lng },
    telephone: clinic.phone ?? undefined,
    url: clinic.website ?? undefined,
    medicalSpecialty: "Urgent Care",
    availableService: clinic.services.map((s) => ({ "@type": "MedicalTherapy", name: s })),
    aggregateRating: avgRating != null
      ? { "@type": "AggregateRating", ratingValue: avgRating.toFixed(1), reviewCount: ratings.length }
      : undefined,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Breadcrumb + clinic header */}
      <section className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 flex-wrap">
            <a href="/urgent-care" className="hover:text-ubie-blue">Urgent Care</a>
            <ChevronRight className="h-3 w-3" />
            <a href={`/urgent-care/${stateSlug}/${citySlug}`} className="hover:text-ubie-blue capitalize">{clinic.city}</a>
            <ChevronRight className="h-3 w-3" />
            <span className="text-ubie-dark font-medium truncate">{clinic.name}</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold text-ubie-dark">{clinic.name}</h1>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {clinic.streetAddress}, {clinic.city}, {clinic.state} {clinic.zip}
            </span>
            {clinic.phone && (
              <a href={`tel:${clinic.phone}`} className="flex items-center gap-1 hover:text-ubie-blue">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {clinic.phone}
              </a>
            )}
            {clinic.website && (
              <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-ubie-blue">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                Website
              </a>
            )}
          </div>

          {avgRating != null && (
            <div className="flex items-center gap-1 mt-2">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
              ))}
              <span className="text-sm font-semibold text-ubie-dark ml-1">{avgRating.toFixed(1)}</span>
              <span className="text-sm text-gray-400">({ratings.length} review{ratings.length !== 1 ? "s" : ""})</span>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* ── CLAIM BANNER ─────────────────────────────────────────────── */}
        <ClaimBanner
          clinicName={clinic.name}
          claimPath={`/urgent-care/${stateSlug}/${citySlug}/${addressSlug}/${clinicSlug}/claim`}
          isClaimed={clinic.isClaimed}
        />

        {/* ── WAIT TIME (hero) ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ubie-dark flex items-center gap-2">
              <Clock className="h-4 w-4 text-ubie-blue" />
              Current Wait Time
            </h2>
            <a
              href={`/urgent-care/${stateSlug}/${citySlug}/${addressSlug}/${clinicSlug}/report-wait`}
              className="text-xs text-ubie-blue hover:underline font-medium"
            >
              Update →
            </a>
          </div>
          <WaitTimeBadge
            estimate={estimate}
            capacity={clinic.capacity as ClinicCapacity}
            size="hero"
            isClosed={isClosed}
            nextOpenLabel={nextOpen}
            yesterdayAvgMinutes={yesterdayAvgMinutes}
          />

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            {clinic.phone && (
              <a
                href={`tel:${clinic.phone}`}
                className="rounded-[30px] border border-ubie-blue text-ubie-blue text-xs font-semibold px-4 py-2 hover:bg-ubie-blue hover:text-white transition-colors"
              >
                📞 Call ahead
              </a>
            )}
            <a
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[30px] border border-gray-200 text-gray-600 text-xs font-semibold px-4 py-2 hover:border-ubie-blue hover:text-ubie-blue transition-colors"
            >
              🗺 Get directions
            </a>
            <a
              href={`/urgent-care/${stateSlug}/${citySlug}/${addressSlug}/${clinicSlug}/report-wait`}
              className="rounded-[30px] border border-gray-200 text-gray-600 text-xs font-semibold px-4 py-2 hover:border-ubie-blue hover:text-ubie-blue transition-colors"
            >
              ✏️ Update wait time
            </a>
          </div>
        </div>

        {/* ── SERVICES ─────────────────────────────────────────────────── */}
        {clinic.services.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-ubie-dark mb-3">Services Offered</h2>
            <div className="flex flex-wrap gap-2">
              {clinic.services.map((service) => (
                <a
                  key={service}
                  href={`/urgent-care/${stateSlug}/${citySlug}/services/${serviceToSlug(service)}?from=${clinicSlug}`}
                  className="rounded-full bg-ubie-blue-light border border-ubie-blue/20 text-ubie-blue text-xs font-medium px-3 py-1 hover:bg-ubie-blue hover:text-white transition-colors"
                >
                  {service}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── MAP ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-ubie-dark">Location</h2>
            <p className="text-sm text-gray-500">{clinic.streetAddress}, {clinic.city}, {clinic.state} {clinic.zip}</p>
          </div>
          <iframe
            src={mapsEmbedUrl}
            width="100%"
            height="220"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map of ${clinic.name}`}
          />
        </div>

        {/* ── REVIEWS ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ubie-dark">Patient Reviews</h2>
            {clinic.reviews.length > 0 && (
              <span className="text-xs text-gray-400">{clinic.reviews.length} review{clinic.reviews.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {clinic.reviews.length > 0 && (
            <div className="space-y-3 mb-4">
              {clinic.reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{review.user.name ?? "Patient"}</span>
                  </div>
                  {review.body && <p className="text-sm text-gray-600">{review.body}</p>}
                </div>
              ))}
            </div>
          )}

          <WriteReviewForm clinicId={clinic.id} isFirst={clinic.reviews.length === 0} />
        </div>

        {/* ── ZOCDOC BOOKING ───────────────────────────────────────────── */}
        {clinic.zocdocUrl && <ZocDocBanner zocdocUrl={clinic.zocdocUrl} />}

        {/* ── SYMPTOM CHECKER ───────────────────────────────────────────── */}
        {showSymptomChecker && <SymptomCheckerCTA />}

      </div>
    </main>
  );
}
