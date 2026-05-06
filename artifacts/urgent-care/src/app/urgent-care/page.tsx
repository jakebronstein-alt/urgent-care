import type { Metadata } from "next";
import Link from "next/link";
import { Search, MapPin } from "lucide-react";
import { SymptomCheckerCTA } from "@/components/clinic/SymptomCheckerCTA";
import { ServiceFilter } from "@/components/clinic/ServiceFilter";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Urgent Care Near Me — Live Wait Times | UbieHealth",
  description:
    "See how many people are waiting at urgent care clinics near you before you leave home. Live wait times, no appointment needed — X-Ray, COVID Testing, Flu Shots & more.",
};

const FEATURED_CITIES = [
  { label: "Manhattan, NY",         stateSlug: "ny", citySlug: "new-york" },
  { label: "Brooklyn, NY",          stateSlug: "ny", citySlug: "brooklyn" },
  { label: "Flushing (Queens), NY", stateSlug: "ny", citySlug: "flushing" },
  { label: "The Bronx, NY",         stateSlug: "ny", citySlug: "bronx" },
  { label: "Staten Island, NY",     stateSlug: "ny", citySlug: "staten-island" },
  { label: "Jersey City, NJ",       stateSlug: "nj", citySlug: "jersey-city" },
  { label: "Hoboken, NJ",           stateSlug: "nj", citySlug: "hoboken" },
];

export default function UrgentCareHomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero — gradient matches enterprise brand site */}
      <section className="uc-hero relative overflow-hidden">
        <div className="uc-hero-glow absolute inset-0 pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-4 text-center" style={{ paddingTop: "72px", paddingBottom: "88px" }}>
          {/* Live indicator pill */}
          <div className="inline-flex items-center gap-2.5 mb-6 px-4 py-2 rounded-full border uc-pill text-xs font-extrabold tracking-[0.06em] uppercase" style={{ color: "#09205b" }}>
            <span className="uc-dot h-2 w-2 rounded-full animate-pulse" />
            Live wait times · Updated in real time
          </div>

          <h1
            className="font-black leading-tight mb-5"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", letterSpacing: "-0.025em", color: "#09205b" }}
          >
            Find Urgent Care{" "}
            <span style={{ color: "#f777a6" }}>Near You</span>
          </h1>

          <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: "#5a6070", lineHeight: 1.6 }}>
            See how many people are in line before you leave home — no appointment needed.
          </p>

          {/* Search bar */}
          <form action="/urgent-care/search" method="GET" className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#aaabac" }} />
              <input
                type="text"
                name="q"
                placeholder="Neighborhood, zip code, or city"
                className="uc-search-input w-full rounded-full border pl-10 pr-4 py-3.5 text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              className="uc-btn-primary rounded-full text-white px-6 py-3.5 text-sm font-bold flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-5 mt-7 text-xs font-semibold" style={{ color: "#8a8fa0" }}>
            <span>✓ 237+ NYC clinics</span>
            <span>✓ Real waiting room data</span>
            <span>✓ Free, no sign-up</span>
          </div>
        </div>
      </section>

      {/* Browse by area */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <p className="text-xs font-extrabold tracking-[0.14em] uppercase mb-3" style={{ color: "#3959cc" }}>
          Browse by area
        </p>
        <h2 className="font-black mb-6" style={{ fontSize: "1.75rem", letterSpacing: "-0.02em", color: "#09205b" }}>
          Urgent care near you
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {FEATURED_CITIES.map((city) => (
            <Link
              key={city.citySlug}
              href={`/urgent-care/${city.stateSlug}/${city.citySlug}`}
              className="uc-city-card rounded-xl px-4 py-3.5 text-sm font-semibold transition-all"
            >
              {city.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Search by service */}
      <section className="max-w-5xl mx-auto px-4 pb-14">
        <p className="text-xs font-extrabold tracking-[0.14em] uppercase mb-3" style={{ color: "#3959cc" }}>
          Search by service
        </p>
        <h2 className="font-black mb-6" style={{ fontSize: "1.75rem", letterSpacing: "-0.02em", color: "#09205b" }}>
          Filter by what you need
        </h2>
        <Suspense>
          <ServiceFilter mode="search" />
        </Suspense>
      </section>

      {/* Symptom checker CTA */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <SymptomCheckerCTA />
      </section>
    </main>
  );
}
