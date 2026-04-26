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
  usePathname: () => "/urgent-care/search",
  useSearchParams: () => new URLSearchParams(),
}));

const mockFindMany = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    clinic: { findMany: mockFindMany },
    outOfAreaSearch: { create: mockCreate },
  },
}));

vi.mock("@/lib/wait-time", () => ({
  calculateWaitTime: vi.fn(),
  estimateWaitTime: vi.fn(() => ({
    adjustedCount: 2,
    estimatedMinutes: 25,
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
    name: "Midtown Urgent Care",
    streetAddress: "1 W 57th St",
    city: "New York",
    state: "NY",
    zip: "10019",
    phone: "(212) 555-0001",
    stateSlug: "ny",
    citySlug: "new-york",
    addressSlug: "1-w-57th-st",
    clinicSlug: "midtown-urgent-care",
    hours: null,
    services: [],
    capacity: "MEDIUM",
    waitReports: [],
    waitSettings: null,
    reviews: [],
    ...overrides,
  };
}

async function renderSearchPage(params: { q?: string; service?: string }) {
  const SearchPage = (await import("@/app/urgent-care/search/page")).default;
  const jsx = await SearchPage({
    searchParams: Promise.resolve(params),
  });
  render(jsx as React.ReactElement);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("SearchPage — no query", () => {
  beforeEach(() => {
    mockFindMany.mockResolvedValue([]);
    mockCreate.mockResolvedValue({});
    vi.resetModules();
  });

  it("shows the 'Search by service' heading", async () => {
    await renderSearchPage({});
    expect(
      screen.getByRole("heading", { name: /search by service/i })
    ).toBeInTheDocument();
  });

  it("renders the service filter pills", async () => {
    await renderSearchPage({});
    expect(screen.getByRole("button", { name: "X-Ray" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "COVID Testing" })
    ).toBeInTheDocument();
  });

  it("shows a prompt to select a service", async () => {
    await renderSearchPage({});
    expect(
      screen.getByText(/select a service above/i)
    ).toBeInTheDocument();
  });
});

describe("SearchPage — NYC location query", () => {
  beforeEach(() => {
    mockFindMany.mockResolvedValue([makeDbClinic()]);
    mockCreate.mockResolvedValue({});
    vi.resetModules();
  });

  it("shows clinic count and location heading for a Manhattan query", async () => {
    await renderSearchPage({ q: "manhattan" });
    expect(
      screen.getByRole("heading", { name: /urgent care in manhattan/i })
    ).toBeInTheDocument();
  });

  it("renders a clinic card for each result", async () => {
    await renderSearchPage({ q: "brooklyn" });
    expect(screen.getAllByTestId("clinic-card")).toHaveLength(1);
    expect(screen.getByText("Midtown Urgent Care")).toBeInTheDocument();
  });

  it("shows the clinic count in the subheading", async () => {
    await renderSearchPage({ q: "bronx" });
    expect(screen.getByText(/1 clinic/i)).toBeInTheDocument();
  });

  it("shows empty state when no clinics match the query", async () => {
    mockFindMany.mockResolvedValue([]);
    await renderSearchPage({ q: "brooklyn" });
    expect(screen.getByText(/no clinics found/i)).toBeInTheDocument();
  });

  it("shows breadcrumb back to /urgent-care", async () => {
    await renderSearchPage({ q: "manhattan" });
    const link = screen.getByRole("link", { name: /urgent care/i });
    expect(link).toHaveAttribute("href", "/urgent-care");
  });

  it("renders multiple clinic cards when multiple clinics are returned", async () => {
    mockFindMany.mockResolvedValue([
      makeDbClinic({ id: "c1", name: "Clinic Alpha" }),
      makeDbClinic({ id: "c2", name: "Clinic Beta" }),
    ]);
    await renderSearchPage({ q: "manhattan" });
    const cards = screen.getAllByTestId("clinic-card");
    expect(cards).toHaveLength(2);
  });
});

describe("SearchPage — out-of-area query", () => {
  beforeEach(() => {
    mockFindMany.mockResolvedValue([]);
    mockCreate.mockResolvedValue({});
    vi.resetModules();
  });

  it("shows the out-of-area message for a non-NYC city", async () => {
    await renderSearchPage({ q: "chicago" });
    expect(screen.getByText(/we're not in chicago yet/i)).toBeInTheDocument();
  });

  it("mentions UbieHealth is NYC-only", async () => {
    await renderSearchPage({ q: "los angeles" });
    expect(
      screen.getByText(/currently only available in new york city/i)
    ).toBeInTheDocument();
  });

  it("provides a link to Ubie Consult as an alternative", async () => {
    await renderSearchPage({ q: "seattle" });
    const link = screen.getByRole("link", {
      name: /try ubie consult/i,
    });
    expect(link).toHaveAttribute("href", "https://ubiehealth.com/consult/");
  });

  it("shows borough links so users can still browse NYC", async () => {
    await renderSearchPage({ q: "miami" });
    expect(screen.getByRole("link", { name: "Manhattan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Brooklyn" })).toBeInTheDocument();
  });
});

describe("SearchPage — service filter query", () => {
  beforeEach(() => {
    mockFindMany.mockResolvedValue([makeDbClinic({ services: ["X-Ray"] })]);
    mockCreate.mockResolvedValue({});
    vi.resetModules();
  });

  it("shows the service name in the heading", async () => {
    await renderSearchPage({ service: "X-Ray" });
    expect(
      screen.getByRole("heading", { name: /clinics offering x-ray/i })
    ).toBeInTheDocument();
  });

  it("renders clinic cards for the matching service", async () => {
    await renderSearchPage({ service: "X-Ray" });
    expect(screen.getAllByTestId("clinic-card")).toHaveLength(1);
  });

  it("shows empty state when no clinics offer the service", async () => {
    mockFindMany.mockResolvedValue([]);
    await renderSearchPage({ service: "Travel Medicine" });
    // The body empty-state has a unique detail message
    expect(
      screen.getByText(/we don't have any clinics listed offering travel medicine yet/i)
    ).toBeInTheDocument();
  });
});
