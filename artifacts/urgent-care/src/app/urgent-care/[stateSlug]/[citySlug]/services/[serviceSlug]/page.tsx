import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, CheckCircle2, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { getServiceBySlug } from "@/lib/services-info";
import { calculateWaitTime, estimateWaitTime, ClinicCapacity, ReportSource, REPORT_STALE_HOURS } from "@/lib/wait-time";
import { parseHours, isClinicOpen } from "@/lib/hours";
import { ClinicCard, ClinicCardData } from "@/components/clinic/ClinicCard";

interface Props {
  params: Promise<{
    stateSlug: string;
    citySlug: string;
    serviceSlug: string;
  }>;
  searchParams: Promise<{ from?: string }>;
}

function formatCity(slug: string) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatState(slug: string) {
  return slug.toUpperCase();
}

/** Haversine distance in miles between two lat/lng points */
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug, citySlug, serviceSlug } = await params;
  const service = getServiceBySlug(serviceSlug);
  if (!service) return {};
  const city = formatCity(citySlug);
  const state = formatState(stateSlug);
  const title = `${service.name} Urgent Care in ${city}, ${state} | UbieHealth`;
  const description = `Find urgent care clinics in ${city}, ${state} offering ${service.name}. Compare real-time wait times and patient reviews. Walk in today — no appointment needed.`;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function ServicePage({ params, searchParams }: Props) {
  const { stateSlug, citySlug, serviceSlug } = await params;
  const { from: fromSlug } = await searchParams;

  const service = getServiceBySlug(serviceSlug);
  if (!service) notFound();

  const city = formatCity(citySlug);
  const state = formatState(stateSlug);

  // Fetch all clinics in this city offering the service
  const clinics = await prisma.clinic.findMany({
    where: { stateSlug, citySlug, services: { has: service.name } },
    include: {
      waitReports: { orderBy: { createdAt: "desc" }, take: 1 },
      waitSettings: true,
      reviews: { select: { rating: true } },
    },
  });

  // Look up the "from" clinic for proximity sorting
  const fromClinic = fromSlug
    ? await prisma.clinic.findFirst({
        where: { stateSlug, citySlug, clinicSlug: fromSlug },
        select: { id: true, name: true, lat: true, lng: true },
      })
    : null;

  const now = new Date();

  function toCard(c: (typeof clinics)[number]): ClinicCardData {
    const latestReport = c.waitReports[0];
    const avg = c.waitSettings?.avgMinutesPerPatient ?? 20;
    const reportAgeHours = latestReport
      ? (Date.now() - latestReport.createdAt.getTime()) / 3_600_000
      : Infinity;
    const hasLiveReport = latestReport && reportAgeHours < REPORT_STALE_HOURS;
    const ratings = c.reviews.map((r) => r.rating);
    const waitEstimate = hasLiveReport
      ? calculateWaitTime(
          latestReport!.peopleCount,
          latestReport!.createdAt,
          latestReport!.source as ReportSource,
          c.capacity as ClinicCapacity,
          avg
        )
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
  }

  // Split into "near origin" (up to 3 closest) and "rest of city"
  let nearbyCards: ClinicCardData[] = [];
  let cityCards: ClinicCardData[] = [];

  if (fromClinic) {
    const withDistance = clinics
      .filter((c) => c.id !== fromClinic.id)
      .map((c) => ({
        clinic: c,
        miles: distanceMiles(fromClinic.lat, fromClinic.lng, c.lat, c.lng),
      }))
      .sort((a, b) => a.miles - b.miles);

    nearbyCards = withDistance.slice(0, 3).map((d) => toCard(d.clinic));
    cityCards = withDistance.slice(3).map((d) => toCard(d.clinic));
  } else {
    cityCards = clinics.map(toCard).sort((a, b) => a.name.localeCompare(b.name));
  }

  // JSON-LD: MedicalProcedure + ItemList of clinics
  const allCards = [...nearbyCards, ...cityCards];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalProcedure",
        name: service.name,
        description: service.definition,
        procedureType: "https://schema.org/TherapeuticProcedure",
      },
      {
        "@type": "ItemList",
        name: `Urgent Care Clinics Offering ${service.name} in ${city}, ${state}`,
        numberOfItems: allCards.length,
        itemListElement: allCards.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "MedicalClinic",
            name: c.name,
            address: {
              "@type": "PostalAddress",
              streetAddress: c.streetAddress,
              addressLocality: c.city,
              addressRegion: c.state,
              postalCode: c.zip,
            },
          },
        })),
      },
    ],
  };

  const cityDetailPath = `/urgent-care/${stateSlug}/${citySlug}`;

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Header */}
      <section className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 flex-wrap">
            <Link href="/urgent-care" className="hover:text-ubie-blue">Urgent Care</Link>
            <ChevronRight className="h-3 w-3" />
            <a href={cityDetailPath} className="hover:text-ubie-blue capitalize">{city}</a>
            <ChevronRight className="h-3 w-3" />
            <span className="text-ubie-dark font-medium">{service.name}</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold text-ubie-dark leading-tight">
            {service.name} at Urgent Care Clinics in {city}, {state}
          </h1>
          <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {allCards.length > 0
              ? `${allCards.length} clinic${allCards.length !== 1 ? "s" : ""} in ${city} offering ${service.name}`
              : `No clinics listed yet in ${city} for ${service.name}`}
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Service definition */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-ubie-dark mb-2">What is {service.name}?</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{service.definition}</p>

          <h3 className="font-semibold text-ubie-dark mt-4 mb-2 text-sm">
            Reasons you might need {service.name}
          </h3>
          <ul className="space-y-2">
            {service.reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-ubie-blue shrink-0 mt-0.5" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Nearby clinics (only shown when coming from a specific clinic) */}
        {fromClinic && nearbyCards.length > 0 && (
          <div>
            <h2 className="font-semibold text-ubie-dark mb-3">
              Clinics near {fromClinic.name} offering {service.name}
            </h2>
            <div className="space-y-3">
              {nearbyCards.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          </div>
        )}

        {/* Rest of city */}
        {cityCards.length > 0 && (
          <div>
            <h2 className="font-semibold text-ubie-dark mb-3">
              {fromClinic
                ? `More ${service.name} urgent care in ${city}, ${state}`
                : `${service.name} urgent care in ${city}, ${state}`}
            </h2>
            <div className="space-y-3">
              {cityCards.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          </div>
        )}

        {allCards.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-medium text-ubie-dark">No clinics listed yet</p>
            <p className="text-sm mt-1">
              We&apos;re adding more clinics in {city} offering {service.name} soon.
            </p>
          </div>
        )}

        {/* Future state/national expansion note */}
        <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
          Looking beyond {city}? More {state} and nationwide results coming soon.
        </div>

        {/* Ubie symptom / disease links */}
        <div className="bg-ubie-blue-light rounded-2xl border border-ubie-blue/15 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ubie-blue mb-1">
            Powered by Ubie
          </p>
          <h2 className="font-bold text-ubie-dark text-base mb-1">
            Not sure if you need {service.name}?
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Check your symptoms with Ubie — free, medically validated, and trusted by 13M+ people.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {service.ubieLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 rounded-[30px] px-5 py-3 text-sm font-semibold text-center transition-colors ${
                  link.type === "disease"
                    ? "bg-ubie-blue text-white hover:bg-ubie-blue/90"
                    : "bg-white border border-ubie-blue text-ubie-blue hover:bg-ubie-blue hover:text-white"
                }`}
              >
                {link.label} →
              </a>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
