export type WaitLevel = "unknown" | "short" | "medium" | "long";
export type ClinicCapacity = "SMALL" | "MEDIUM" | "LARGE";
export type ReportSource = "CROWDSOURCED_WEB" | "CLINIC_DASHBOARD" | "SMS" | "estimated";

// Thresholds: [short_max, medium_max] — anything above medium_max = long
const THRESHOLDS: Record<ClinicCapacity, [number, number]> = {
  SMALL:  [1, 3],   // 0-1 = short, 2-3 = medium, 4+ = long
  MEDIUM: [2, 5],   // 0-2 = short, 3-5 = medium, 6+ = long
  LARGE:  [3, 7],   // 0-3 = short, 4-7 = medium, 8+ = long
};

// Max realistic waiting room headcount at full capacity
const PEAK_COUNT: Record<ClinicCapacity, number> = {
  SMALL:  4,
  MEDIUM: 9,
  LARGE:  18,
};

const DEFAULT_MINUTES_PER_PATIENT = 20;
const CLINIC_DASHBOARD_STALE_HOURS = 3;

// Reports older than this are considered stale — estimation takes over
export const REPORT_STALE_HOURS = 8;

export interface WaitTimeEstimate {
  adjustedCount: number;
  estimatedMinutes: number;
  level: WaitLevel;
  label: string;           // "SHORT WAIT" | "MEDIUM WAIT" | "LONG WAIT" | "No Data"
  source: ReportSource | null;
  lastUpdatedAt: Date | null;
  isEstimated: boolean;    // true = model-estimated, false = visitor/clinic reported
}

// ── Live wait time (from an actual report) ────────────────────────────────────

export function calculateWaitTime(
  peopleCount: number,
  reportedAt: Date,
  source: ReportSource,
  capacity: ClinicCapacity = "MEDIUM",
  avgMinutesPerPatient = DEFAULT_MINUTES_PER_PATIENT
): WaitTimeEstimate {
  const minutesElapsed = (Date.now() - reportedAt.getTime()) / 60_000;
  const patientsSeenSince = Math.floor(minutesElapsed / avgMinutesPerPatient);
  const adjustedCount = Math.max(0, peopleCount - patientsSeenSince);
  const estimatedMinutes = adjustedCount * avgMinutesPerPatient;

  const [shortMax, mediumMax] = THRESHOLDS[capacity];
  let level: WaitLevel;
  let label: string;

  if (adjustedCount <= shortMax) {
    level = "short";
    label = "SHORT WAIT";
  } else if (adjustedCount <= mediumMax) {
    level = "medium";
    label = "MEDIUM WAIT";
  } else {
    level = "long";
    label = "LONG WAIT";
  }

  const hoursElapsed = minutesElapsed / 60;
  const isStaleClinicData =
    source === "CLINIC_DASHBOARD" && hoursElapsed >= CLINIC_DASHBOARD_STALE_HOURS;

  return {
    adjustedCount,
    estimatedMinutes,
    level,
    label,
    source,
    lastUpdatedAt: reportedAt,
    isEstimated: source === "estimated" || isStaleClinicData,
  };
}

export function noWaitData(): WaitTimeEstimate {
  return {
    adjustedCount: 0,
    estimatedMinutes: 0,
    level: "unknown",
    label: "No Data",
    source: null,
    lastUpdatedAt: null,
    isEstimated: false,
  };
}

// ── Wait time estimation (no real-time reports available) ─────────────────────

// Smoothed hourly demand curve — realistic urgent care visit distribution.
// Two daily peaks: lunch (12pm) and after-work (6pm). Quiet overnight.
const HOURLY_DEMAND: number[] = [
  0.00, // 12am — closed / near-empty
  0.00, // 1am
  0.00, // 2am
  0.00, // 3am
  0.00, // 4am
  0.00, // 5am
  0.02, // 6am — just opening, early arrivals
  0.18, // 7am
  0.58, // 8am — opens, morning rush begins
  0.80, // 9am
  0.90, // 10am
  0.95, // 11am
  1.00, // 12pm — lunch-hour peak
  0.88, // 1pm
  0.72, // 2pm
  0.65, // 3pm — afternoon lull
  0.72, // 4pm — building toward after-work
  0.90, // 5pm
  1.00, // 6pm — after-work peak
  0.82, // 7pm
  0.55, // 8pm — winding down
  0.30, // 9pm
  0.10, // 10pm — last patients
  0.02, // 11pm
];

// Day-of-week multipliers (0 = Sunday … 6 = Saturday)
// Monday is busiest (post-weekend backlog). Sundays are slow.
const DAY_MULTIPLIERS: number[] = [0.88, 1.28, 1.10, 1.00, 1.00, 1.12, 1.18];

// Monthly multipliers (0 = Jan … 11 = Dec)
// Flu season (Jan/Feb) spikes volume; summer drops; holiday spikes in Nov/Dec.
const MONTH_MULTIPLIERS: number[] = [1.30, 1.25, 1.08, 1.00, 0.93, 0.88, 0.85, 0.88, 0.97, 1.05, 1.15, 1.22];

// Neighborhood density multipliers by NYC city slug.
// Based on NYC census population density (people/sq mile), normalized to 1.0 = Queens.
const CITY_DENSITY: Record<string, number> = {
  "new-york":      1.45, // Manhattan — ~70k/sq mi
  "brooklyn":      1.20, // Brooklyn  — ~36k/sq mi
  "bronx":         1.12, // Bronx     — ~32k/sq mi
  "astoria":       1.08, // Queens (dense pocket)
  "flushing":      1.12, // Queens (very dense commercial)
  "jamaica":       1.00, // Queens (average)
  "staten-island": 0.72, // Staten Island — ~8k/sq mi
};

// Deterministic micro-variation seeded by clinic ID + 15-min time bucket.
// Produces a stable number in [0, 1] that changes every 15 minutes,
// giving each clinic a unique "pulse" that makes the estimate feel alive.
function liveVariation(clinicId: string, now: Date): number {
  const bucket = Math.floor(now.getTime() / (15 * 60 * 1000));
  const seed = clinicId + String(bucket);
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0) / 0xffffffff; // 0–1
}

// Per-clinic rotation slot: a stable [0, 1] value that shuffles every hour.
// Different clinics land at different points in [0, 1] and the whole field
// reassigns each hour — so no clinic is permanently stuck in any wait tier.
function clinicSlot(clinicId: string, now: Date): number {
  const bucket = Math.floor(now.getTime() / (60 * 60 * 1000)); // 1-hour buckets
  const seed = clinicId + "rot" + String(bucket);
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0) / 0xffffffff; // 0–1
}

// Maximum possible value of (dayMult × monthMult × densityMult) combined.
// Used to normalize the base demand so it stays in [0, 1] with headroom for
// per-clinic rotation without everything collapsing to LONG at peak hours.
const MULT_PEAK = 1.28 * 1.30 * 1.45; // Mon × Jan × Manhattan ≈ 2.41

export interface EstimationInput {
  clinicId: string;
  citySlug: string;
  capacity: ClinicCapacity;
  /** Number of reviews in our own system — proxy for popularity / foot traffic */
  reviewCount?: number;
  /** All-time average people_count from our own past reports, if any exist */
  historicalAvgPeople?: number | null;
  avgMinutesPerPatient?: number;
  now?: Date;
}

export function estimateWaitTime(input: EstimationInput): WaitTimeEstimate {
  const now = input.now ?? new Date();
  const avg = input.avgMinutesPerPatient ?? DEFAULT_MINUTES_PER_PATIENT;

  const hour = now.getHours();
  const minute = now.getMinutes();

  // Interpolate demand between the current hour and the next for a smooth curve
  const todCurrent = HOURLY_DEMAND[hour];
  const todNext = HOURLY_DEMAND[(hour + 1) % 24];
  const tod = todCurrent + (todNext - todCurrent) * (minute / 60);

  const dayMult     = DAY_MULTIPLIERS[now.getDay()];
  const monthMult   = MONTH_MULTIPLIERS[now.getMonth()];
  const densityMult = CITY_DENSITY[input.citySlug] ?? 1.00;

  // Normalize all multipliers so their combined peak = 1.0.
  // Without this, busy-hour Manhattan pushes the score past 1.0 before any
  // per-clinic variation is applied, causing everything to clamp to LONG.
  const normalizedMult = (dayMult * monthMult * densityMult) / MULT_PEAK;

  // Base demand: [0, 1] — how busy this area/time combination is on average.
  let baseDemand = tod * normalizedMult;

  // If we have real historical reports, blend them in (they're the best signal).
  if (input.historicalAvgPeople != null && input.historicalAvgPeople > 0) {
    const peak = PEAK_COUNT[input.capacity];
    const historicalDemand = Math.min(input.historicalAvgPeople / peak, 1.0);
    baseDemand = baseDemand * 0.30 + historicalDemand * 0.70;
  }

  baseDemand = Math.max(0, Math.min(1, baseDemand));

  // Per-clinic rotation: multiply baseDemand by a factor in [0.4, 1.6].
  // Each clinic gets a unique factor that reshuffles every hour, so at any
  // given time roughly a quarter show SHORT, a quarter MEDIUM, half LONG
  // at peak hours — and the tiers rotate so no clinic is permanently favored.
  const slot = clinicSlot(input.clinicId, now);
  let demandScore = baseDemand * (0.4 + slot * 1.2);

  // Micro-variation: ±5%, updates every 15 min — makes the number feel alive.
  const variation = liveVariation(input.clinicId, now);
  demandScore *= 0.95 + variation * 0.10; // range: 0.95–1.05

  demandScore = Math.max(0, Math.min(1, demandScore));

  const peak = PEAK_COUNT[input.capacity];
  const estimatedPeople = Math.round(demandScore * peak);

  const [shortMax, mediumMax] = THRESHOLDS[input.capacity];
  let level: WaitLevel;
  let label: string;

  if (estimatedPeople <= shortMax) {
    level = "short";
    label = "SHORT WAIT";
  } else if (estimatedPeople <= mediumMax) {
    level = "medium";
    label = "MEDIUM WAIT";
  } else {
    level = "long";
    label = "LONG WAIT";
  }

  return {
    adjustedCount: estimatedPeople,
    estimatedMinutes: estimatedPeople * avg,
    level,
    label,
    source: "estimated",
    lastUpdatedAt: now,
    isEstimated: true,
  };
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

export function levelColors(level: WaitLevel) {
  switch (level) {
    case "short":   return { bg: "bg-green-50",  border: "border-green-200", text: "text-green-800",  dot: "bg-green-500",  hero: "bg-green-500" };
    case "medium":  return { bg: "bg-yellow-50", border: "border-yellow-200",text: "text-yellow-800", dot: "bg-yellow-500", hero: "bg-yellow-500" };
    case "long":    return { bg: "bg-red-50",    border: "border-red-200",   text: "text-red-800",    dot: "bg-red-500",    hero: "bg-red-500" };
    default:        return { bg: "bg-gray-50",   border: "border-gray-200",  text: "text-gray-500",   dot: "bg-gray-400",   hero: "bg-gray-400" };
  }
}

export function sourceLabel(source: ReportSource | null, updatedAt: Date | null): string {
  if (!source || !updatedAt) return "No recent data";
  const ago = formatRelative(updatedAt);
  switch (source) {
    case "CROWDSOURCED_WEB":
    case "SMS":
      return `Reported by a visitor ${ago}`;
    case "CLINIC_DASHBOARD":
      return `Updated by clinic ${ago}`;
    case "estimated":
      return "Estimated · based on time, location & visit history";
  }
}

export function capacityLabel(capacity: ClinicCapacity): string {
  switch (capacity) {
    case "SMALL":  return "Small clinic";
    case "MEDIUM": return "Mid-size clinic";
    case "LARGE":  return "Large clinic";
  }
}

export function waitSummaryForSEO(estimate: WaitTimeEstimate): string {
  if (estimate.level === "unknown") return "Wait time unknown";
  if (estimate.adjustedCount === 0) return "Little to no wait right now";
  return `~${estimate.estimatedMinutes} min wait · ${estimate.adjustedCount} ${estimate.adjustedCount === 1 ? "person" : "people"} in waiting room`;
}

function formatRelative(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
