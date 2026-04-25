import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClinicCard, type ClinicCardData } from "@/components/clinic/ClinicCard";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

function makeClinic(overrides: Partial<ClinicCardData> = {}): ClinicCardData {
  return {
    id: "clinic-1",
    name: "Acme Urgent Care",
    streetAddress: "123 Main St",
    city: "New York",
    state: "NY",
    zip: "10001",
    phone: "(212) 555-1234",
    stateSlug: "ny",
    citySlug: "new-york",
    addressSlug: "123-main-st",
    clinicSlug: "acme-urgent-care",
    waitEstimate: {
      adjustedCount: 1,
      estimatedMinutes: 20,
      level: "short",
      label: "SHORT WAIT",
      source: "CROWDSOURCED_WEB",
      lastUpdatedAt: new Date(),
      isEstimated: false,
    },
    ...overrides,
  };
}

describe("ClinicCard", () => {
  it("renders the clinic name", () => {
    render(<ClinicCard clinic={makeClinic()} />);
    expect(screen.getByText("Acme Urgent Care")).toBeInTheDocument();
  });

  it("renders the street address and city", () => {
    render(<ClinicCard clinic={makeClinic()} />);
    expect(screen.getByText(/123 Main St.*New York/)).toBeInTheDocument();
  });

  it("renders the phone number when provided", () => {
    render(<ClinicCard clinic={makeClinic({ phone: "(212) 555-1234" })} />);
    expect(screen.getByText("(212) 555-1234")).toBeInTheDocument();
  });

  it("does not render phone section when phone is null", () => {
    render(<ClinicCard clinic={makeClinic({ phone: null })} />);
    expect(screen.queryByText(/555/)).toBeNull();
  });

  it("links to the correct clinic URL", () => {
    render(<ClinicCard clinic={makeClinic()} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/urgent-care/ny/new-york/123-main-st/acme-urgent-care");
  });

  it("renders the wait time badge", () => {
    render(<ClinicCard clinic={makeClinic()} />);
    expect(screen.getByText("SHORT WAIT")).toBeInTheDocument();
  });

  it("shows 'Open now' indicator when isOpenNow=true", () => {
    render(<ClinicCard clinic={makeClinic({ isOpenNow: true })} />);
    expect(screen.getByText("Open now")).toBeInTheDocument();
  });

  it("shows 'Closed' indicator when isOpenNow=false", () => {
    render(<ClinicCard clinic={makeClinic({ isOpenNow: false })} />);
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("does not show open/closed indicator when isOpenNow is undefined", () => {
    render(<ClinicCard clinic={makeClinic({ isOpenNow: undefined })} />);
    expect(screen.queryByText("Open now")).toBeNull();
  });

  it("renders the average rating when provided", () => {
    render(<ClinicCard clinic={makeClinic({ avgRating: 4.5, reviewCount: 23 })} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(23)")).toBeInTheDocument();
  });

  it("does not render rating section when avgRating is null", () => {
    render(<ClinicCard clinic={makeClinic({ avgRating: null })} />);
    expect(screen.queryByText(/4\./)).toBeNull();
  });

  it("shows closed badge when isClosed=true", () => {
    render(
      <ClinicCard
        clinic={makeClinic({
          isClosed: true,
          waitEstimate: {
            adjustedCount: 0,
            estimatedMinutes: 0,
            level: "unknown",
            label: "No Data",
            source: null,
            lastUpdatedAt: null,
            isEstimated: false,
          },
        })}
      />
    );
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });
});
