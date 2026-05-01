import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ── Module mocks ─────────────────────────────────────────────────────────────

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
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/urgent-care/ny/brooklyn/123-main-st/downtown-urgent-care",
}));

// react cache() — just call the wrapped function directly
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: (fn: (...args: unknown[]) => unknown) => fn };
});

const mockFindUnique = vi.fn();
const mockPageViewCreate = vi.fn(() => Promise.resolve());
const mockAggregate = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    clinic: { findUnique: mockFindUnique, findMany: mockFindMany },
    pageView: { create: mockPageViewCreate },
    waitingRoomReport: { aggregate: mockAggregate },
  },
}));

vi.mock("@/lib/wait-time", () => ({
  calculateWaitTime: vi.fn(() => ({
    adjustedCount: 2,
    estimatedMinutes: 20,
    level: "low",
    label: "SHORT WAIT",
    source: "CROWD",
    lastUpdatedAt: new Date(),
    isEstimated: false,
  })),
  estimateWaitTime: vi.fn(() => ({
    adjustedCount: 3,
    estimatedMinutes: 35,
    level: "moderate",
    label: "MODERATE WAIT",
    source: null,
    lastUpdatedAt: null,
    isEstimated: true,
  })),
  waitSummaryForSEO: vi.fn(() => "~35 min wait"),
  REPORT_STALE_HOURS: 4,
  ClinicCapacity: {},
  ReportSource: {},
}));

const mockParseHours = vi.fn(() => null as ReturnType<typeof import("@/lib/hours").parseHours>);
const mockIsClinicOpen = vi.fn(() => true);
const mockNextOpenLabel = vi.fn(() => null as string | null);

vi.mock("@/lib/hours", () => ({
  parseHours: mockParseHours,
  isClinicOpen: mockIsClinicOpen,
  nextOpenLabel: mockNextOpenLabel,
}));

vi.mock("@/lib/services-info", () => ({
  serviceToSlug: (s: string) => s.toLowerCase().replace(/\s+/g, "-"),
}));

vi.mock("@/components/clinic/WaitTimeBadge", () => ({
  WaitTimeBadge: ({ isClosed }: { isClosed: boolean }) => (
    <div data-testid="wait-time-badge">
      {isClosed ? "CLOSED" : "OPEN"}
    </div>
  ),
}));

vi.mock("@/components/clinic/ClaimBanner", () => ({
  ClaimBanner: ({ clinicName }: { clinicName: string }) => (
    <div data-testid="claim-banner">{clinicName}</div>
  ),
}));

vi.mock("@/components/clinic/SymptomCheckerCTA", () => ({
  SymptomCheckerCTA: () => <div data-testid="symptom-checker-cta">Start a symptom check</div>,
}));

vi.mock("@/components/clinic/WriteReviewForm", () => ({
  WriteReviewForm: () => <div data-testid="write-review-form">Write a review</div>,
}));

vi.mock("@/components/clinic/ZocDocBanner", () => ({
  ZocDocBanner: ({ zocdocUrl }: { zocdocUrl: string }) => (
    <div data-testid="zocdoc-banner">{zocdocUrl}</div>
  ),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDbClinic(overrides: Record<string, unknown> = {}) {
  return {
    id: "clinic-1",
    name: "Downtown Urgent Care",
    streetAddress: "123 Main St",
    city: "Brooklyn",
    state: "NY",
    zip: "11201",
    phone: "(718) 555-0001",
    website: "https://example.com",
    stateSlug: "ny",
    citySlug: "brooklyn",
    addressSlug: "123-main-st",
    clinicSlug: "downtown-urgent-care",
    hours: null,
    services: [],
    capacity: "MEDIUM",
    lat: 40.6782,
    lng: -73.9442,
    isClaimed: false,
    zocdocUrl: null,
    waitReports: [],
    waitSettings: null,
    reviews: [],
    ...overrides,
  };
}

function makeReview(overrides: Record<string, unknown> = {}) {
  return {
    id: "r1",
    rating: 4,
    body: "Great service, short wait.",
    createdAt: new Date("2025-01-01"),
    user: { name: "Alice" },
    ...overrides,
  };
}

async function renderClinicDetailPage(
  stateSlug = "ny",
  citySlug = "brooklyn",
  addressSlug = "123-main-st",
  clinicSlug = "downtown-urgent-care"
) {
  const ClinicDetailPage = (
    await import(
      "@/app/urgent-care/[stateSlug]/[citySlug]/[addressSlug]/[clinicSlug]/page"
    )
  ).default;
  const jsx = await ClinicDetailPage({
    params: Promise.resolve({ stateSlug, citySlug, addressSlug, clinicSlug }),
  });
  render(jsx as React.ReactElement);
}

function setupDefaultMocks() {
  mockFindUnique.mockResolvedValue(makeDbClinic());
  mockAggregate.mockResolvedValue({ _avg: { peopleCount: null }, _count: { peopleCount: 0 } });
  mockFindMany.mockResolvedValue([]);
  mockPageViewCreate.mockResolvedValue({});
  mockParseHours.mockReturnValue(null);
  mockIsClinicOpen.mockReturnValue(true);
  mockNextOpenLabel.mockReturnValue(null);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ClinicDetailPage — page structure", () => {
  beforeEach(() => {
    setupDefaultMocks();
    vi.resetModules();
  });

  it("renders the clinic name as the main heading", async () => {
    await renderClinicDetailPage();
    expect(
      screen.getByRole("heading", { name: /downtown urgent care/i })
    ).toBeInTheDocument();
  });

  it("renders the clinic street address somewhere on the page", async () => {
    await renderClinicDetailPage();
    const elements = screen.getAllByText(/123 Main St/);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the city and state somewhere on the page", async () => {
    await renderClinicDetailPage();
    const elements = screen.getAllByText(/Brooklyn, NY/);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the wait time badge", async () => {
    await renderClinicDetailPage();
    expect(screen.getByTestId("wait-time-badge")).toBeInTheDocument();
  });

  it("renders the Patient Reviews section heading", async () => {
    await renderClinicDetailPage();
    expect(
      screen.getByRole("heading", { name: /patient reviews/i })
    ).toBeInTheDocument();
  });

  it("renders the breadcrumb back to /urgent-care", async () => {
    await renderClinicDetailPage();
    const link = screen.getByRole("link", { name: /urgent care/i });
    expect(link).toHaveAttribute("href", "/urgent-care");
  });

  it("renders the breadcrumb back to the city page", async () => {
    await renderClinicDetailPage();
    const cityLink = screen.getByRole("link", { name: /brooklyn/i });
    expect(cityLink).toHaveAttribute("href", "/urgent-care/ny/brooklyn");
  });

  it("renders the claim banner for the clinic", async () => {
    await renderClinicDetailPage();
    expect(screen.getByTestId("claim-banner")).toBeInTheDocument();
  });

  it("renders the write review form", async () => {
    await renderClinicDetailPage();
    expect(screen.getByTestId("write-review-form")).toBeInTheDocument();
  });
});

describe("ClinicDetailPage — open clinic state", () => {
  beforeEach(() => {
    setupDefaultMocks();
    // parseHours returns non-null so isClinicOpen is consulted; isClinicOpen returns true => open
    mockParseHours.mockReturnValue({ mon: { open: "08:00", close: "20:00" } } as ReturnType<typeof import("@/lib/hours").parseHours>);
    mockIsClinicOpen.mockReturnValue(true);
    vi.resetModules();
  });

  it("shows the wait time badge without a closed indicator", async () => {
    await renderClinicDetailPage();
    const badge = screen.getByTestId("wait-time-badge");
    expect(badge).toHaveTextContent("OPEN");
  });
});

describe("ClinicDetailPage — closed clinic state", () => {
  beforeEach(() => {
    setupDefaultMocks();
    // parseHours returns non-null so isClinicOpen is consulted; isClinicOpen returns false => closed
    mockParseHours.mockReturnValue({ mon: { open: "09:00", close: "17:00" } } as ReturnType<typeof import("@/lib/hours").parseHours>);
    mockIsClinicOpen.mockReturnValue(false);
    mockNextOpenLabel.mockReturnValue("Opens Mon 9:00 AM");
    vi.resetModules();
  });

  it("shows the wait time badge with a closed indicator", async () => {
    await renderClinicDetailPage();
    const badge = screen.getByTestId("wait-time-badge");
    expect(badge).toHaveTextContent("CLOSED");
  });
});

describe("ClinicDetailPage — with reviews", () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockFindUnique.mockResolvedValue(
      makeDbClinic({
        reviews: [
          makeReview({ id: "r1", rating: 5, body: "Excellent care!" }),
          makeReview({ id: "r2", rating: 3, body: "Average wait time.", user: { name: "Bob" } }),
        ],
      })
    );
    vi.resetModules();
  });

  it("renders individual review bodies", async () => {
    await renderClinicDetailPage();
    expect(screen.getByText("Excellent care!")).toBeInTheDocument();
    expect(screen.getByText("Average wait time.")).toBeInTheDocument();
  });

  it("renders review author names", async () => {
    await renderClinicDetailPage();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders the review count next to the section heading", async () => {
    await renderClinicDetailPage();
    const elements = screen.getAllByText(/2 reviews/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the average star rating in the header", async () => {
    await renderClinicDetailPage();
    // average of 5 and 3 is 4.0
    expect(screen.getByText("4.0")).toBeInTheDocument();
  });
});

describe("ClinicDetailPage — with services", () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockFindUnique.mockResolvedValue(
      makeDbClinic({ services: ["X-Ray", "COVID Testing", "Flu Shot"] })
    );
    vi.resetModules();
  });

  it("renders the services offered section", async () => {
    await renderClinicDetailPage();
    expect(
      screen.getByRole("heading", { name: /services offered/i })
    ).toBeInTheDocument();
  });

  it("renders each service as a link", async () => {
    await renderClinicDetailPage();
    expect(screen.getByRole("link", { name: "X-Ray" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "COVID Testing" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Flu Shot" })).toBeInTheDocument();
  });
});

describe("ClinicDetailPage — not found", () => {
  beforeEach(() => {
    mockFindUnique.mockResolvedValue(null);
    vi.resetModules();
  });

  it("calls notFound() when the clinic does not exist", async () => {
    const { notFound } = await import("next/navigation");
    await expect(renderClinicDetailPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
