import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ClinicCardData } from "@/components/clinic/ClinicCard";

// ── Module mocks ────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/urgent-care/ny/new-york",
  useSearchParams: () => new URLSearchParams(),
}));

const mockFindMany = vi.fn();
const mockGroupBy = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    clinic: { findMany: mockFindMany },
    waitingRoomReport: { groupBy: mockGroupBy },
  },
}));

vi.mock("@/lib/wait-time", () => ({
  calculateWaitTime: vi.fn(),
  estimateWaitTime: vi.fn(() => ({
    adjustedCount: 3,
    estimatedMinutes: 35,
    level: "moderate",
    label: "MODERATE WAIT",
    source: null,
    lastUpdatedAt: null,
    isEstimated: true,
  })),
  REPORT_STALE_HOURS: 4,
  ClinicCapacity: {},
  ReportSource: {},
}));

vi.mock("@/lib/hours", () => ({
  parseHours: vi.fn(() => null),
  isClinicOpen: vi.fn(() => true),
}));

vi.mock("@/components/clinic/ClinicCard", () => ({
  ClinicCard: ({ clinic }: { clinic: ClinicCardData }) => (
    <div data-testid="clinic-card">{clinic.name}</div>
  ),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDbClinic(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    name: "Brooklyn Urgent Care",
    streetAddress: "456 Flatbush Ave",
    city: "Brooklyn",
    state: "NY",
    zip: "11201",
    phone: "(718) 555-0002",
    stateSlug: "ny",
    citySlug: "brooklyn",
    addressSlug: "456-flatbush-ave",
    clinicSlug: "brooklyn-urgent-care",
    hours: null,
    services: [],
    capacity: "MEDIUM",
    waitReports: [],
    waitSettings: null,
    reviews: [],
    ...overrides,
  };
}

async function renderCityPage(
  stateSlug: string,
  citySlug: string,
  searchParams: { service?: string } = {}
) {
  const CityPage = (
    await import("@/app/urgent-care/[stateSlug]/[citySlug]/page")
  ).default;
  const jsx = await CityPage({
    params: Promise.resolve({ stateSlug, citySlug }),
    searchParams: Promise.resolve(searchParams),
  });
  render(jsx as React.ReactElement);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CityPage — page structure", () => {
  beforeEach(() => {
    mockFindMany.mockResolvedValue([]);
    mockGroupBy.mockResolvedValue([]);
    vi.resetModules();
  });

  it("renders the city and state in the main heading", async () => {
    await renderCityPage("ny", "brooklyn");
    expect(
      screen.getByRole("heading", { name: /urgent care in brooklyn, ny/i })
    ).toBeInTheDocument();
  });

  it("capitalises multi-word city slugs correctly", async () => {
    await renderCityPage("ny", "new-york");
    expect(
      screen.getByRole("heading", { name: /urgent care in new york, ny/i })
    ).toBeInTheDocument();
  });

  it("shows uppercase state abbreviation for NJ slug", async () => {
    await renderCityPage("nj", "jersey-city");
    expect(
      screen.getByRole("heading", { name: /urgent care in jersey city, nj/i })
    ).toBeInTheDocument();
  });

  it("shows a breadcrumb link back to /urgent-care", async () => {
    await renderCityPage("ny", "brooklyn");
    const link = screen.getByRole("link", { name: /urgent care/i });
    expect(link).toHaveAttribute("href", "/urgent-care");
  });

  it("shows a breadcrumb link to the state page", async () => {
    await renderCityPage("ny", "brooklyn");
    const stateLink = screen.getByRole("link", { name: "NY" });
    expect(stateLink).toHaveAttribute("href", "/urgent-care/ny");
  });

  it("renders the service filter", async () => {
    await renderCityPage("ny", "brooklyn");
    expect(screen.getByRole("button", { name: "X-Ray" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "COVID Testing" })
    ).toBeInTheDocument();
  });

  it("renders the symptom checker CTA", async () => {
    await renderCityPage("ny", "brooklyn");
    expect(screen.getByText(/start a symptom check/i)).toBeInTheDocument();
  });
});

describe("CityPage — empty state (no clinics)", () => {
  beforeEach(() => {
    mockFindMany.mockResolvedValue([]);
    mockGroupBy.mockResolvedValue([]);
    vi.resetModules();
  });

  it("shows 'No clinics listed yet' when there are no results", async () => {
    await renderCityPage("ny", "staten-island");
    // The text appears in both the header count line and the body empty-state; confirm at least one instance is present
    expect(screen.getAllByText(/no clinics listed yet/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows a 'check back shortly' message", async () => {
    await renderCityPage("ny", "bronx");
    expect(screen.getByText(/adding clinics in bronx soon/i)).toBeInTheDocument();
  });
});

describe("CityPage — with clinics", () => {
  beforeEach(() => {
    mockFindMany.mockResolvedValue([makeDbClinic()]);
    mockGroupBy.mockResolvedValue([]);
    vi.resetModules();
  });

  it("renders a clinic card for each clinic", async () => {
    await renderCityPage("ny", "brooklyn");
    expect(screen.getAllByTestId("clinic-card")).toHaveLength(1);
    expect(screen.getByText("Brooklyn Urgent Care")).toBeInTheDocument();
  });

  it("shows the clinic count in the subheading", async () => {
    await renderCityPage("ny", "brooklyn");
    expect(screen.getByText(/1 clinic found/i)).toBeInTheDocument();
  });

  it("renders multiple clinic cards when multiple clinics exist", async () => {
    mockFindMany.mockResolvedValue([
      makeDbClinic({ id: "c1", name: "Clinic One" }),
      makeDbClinic({ id: "c2", name: "Clinic Two" }),
      makeDbClinic({ id: "c3", name: "Clinic Three" }),
    ]);
    await renderCityPage("ny", "brooklyn");
    expect(screen.getAllByTestId("clinic-card")).toHaveLength(3);
    expect(screen.getByText(/3 clinics found/i)).toBeInTheDocument();
  });
});

describe("CityPage — service filter active", () => {
  it("shows service name in clinic count when a service is selected", async () => {
    mockFindMany.mockResolvedValue([
      makeDbClinic({ services: ["X-Ray"] }),
    ]);
    mockGroupBy.mockResolvedValue([]);
    vi.resetModules();

    await renderCityPage("ny", "brooklyn", { service: "X-Ray" });
    expect(screen.getByText(/1 clinic found offering x-ray/i)).toBeInTheDocument();
  });

  it("shows an empty state message when no clinics match the service", async () => {
    mockFindMany.mockResolvedValue([]);
    mockGroupBy.mockResolvedValue([]);
    vi.resetModules();

    await renderCityPage("ny", "brooklyn", { service: "Travel Medicine" });
    expect(
      screen.getByText(/no clinics offering travel medicine in brooklyn/i)
    ).toBeInTheDocument();
  });
});
