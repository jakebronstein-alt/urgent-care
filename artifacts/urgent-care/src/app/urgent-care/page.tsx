import type { Metadata } from "next";
import Link from "next/link";
import { Search, MapPin } from "lucide-react";
import { SymptomCheckerCTA } from "@/components/clinic/SymptomCheckerCTA";
import { ServiceFilter } from "@/components/clinic/ServiceFilter";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Urgent Care Near Me — Real-Time Wait Times & Reviews",
  description:
    "Find urgent care clinics near you in NYC. See real-time waiting room counts, estimated wait times, and verified reviews. Powered by UbieHealth.",
};

const FEATURED_CITIES = [
  { label: "Manhattan, NY",       stateSlug: "ny", citySlug: "new-york" },
  { label: "Brooklyn, NY",        stateSlug: "ny", citySlug: "brooklyn" },
  { label: "Flushing (Queens), NY", stateSlug: "ny", citySlug: "flushing" },
  { label: "The Bronx, NY",       stateSlug: "ny", citySlug: "bronx" },
  { label: "Staten Island, NY",   stateSlug: "ny", citySlug: "staten-island" },
  { label: "Jersey City, NJ",     stateSlug: "nj", citySlug: "jersey-city" },
  { label: "Hoboken, NJ",         stateSlug: "nj", citySlug: "hoboken" },
];

export default function UrgentCareHomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-ubie-blue-light border-b border-ubie-blue/10">
        <div className="max-w-2xl mx-auto px-4 py-14 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-ubie-dark leading-tight">
            Find Urgent Care Near You
          </h1>
          <p className="mt-3 text-gray-500 text-lg">
            Real-time wait times, verified reviews, and symptom guidance — all in one place.
          </p>

          {/* Search bar */}
          <form action="/urgent-care/search" method="GET" className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="q"
                placeholder="Enter neighborhood, zip code, or city"
                className="w-full rounded-[30px] border border-gray-200 bg-white pl-9 pr-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ubie-blue/40 focus:border-ubie-blue"
              />
            </div>
            <button
              type="submit"
              className="rounded-[30px] bg-ubie-blue text-white px-5 py-3 text-sm font-semibold hover:bg-ubie-blue/90 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Browse by area */}
      <section className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="text-lg font-semibold text-ubie-dark mb-4">Browse by area</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FEATURED_CITIES.map((city) => (
            <Link
              key={city.citySlug}
              href={`/urgent-care/${city.stateSlug}/${city.citySlug}`}
              className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-ubie-dark hover:border-ubie-blue hover:text-ubie-blue hover:bg-ubie-blue-light transition-all"
            >
              {city.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Search by service */}
      <section className="max-w-2xl mx-auto px-4 pb-10">
        <h2 className="text-lg font-semibold text-ubie-dark mb-4">Search by service</h2>
        <Suspense>
          <ServiceFilter mode="search" />
        </Suspense>
      </section>

      {/* Symptom checker CTA */}
      <section className="max-w-2xl mx-auto px-4 pb-14">
        <SymptomCheckerCTA />
      </section>
    </main>
  );
}
