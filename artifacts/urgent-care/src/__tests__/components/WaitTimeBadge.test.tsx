import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WaitTimeBadge } from "@/components/clinic/WaitTimeBadge";
import type { WaitTimeEstimate } from "@/lib/wait-time";

function makeEstimate(overrides: Partial<WaitTimeEstimate> = {}): WaitTimeEstimate {
  return {
    adjustedCount: 0,
    estimatedMinutes: 0,
    level: "short",
    label: "SHORT WAIT",
    source: "CROWDSOURCED_WEB",
    lastUpdatedAt: new Date(),
    isEstimated: false,
    ...overrides,
  };
}

describe("WaitTimeBadge (small / card mode)", () => {
  it("shows 'Closed' badge when isClosed=true", () => {
    render(<WaitTimeBadge estimate={makeEstimate()} isClosed={true} />);
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("shows the wait label for a short-wait estimate", () => {
    render(<WaitTimeBadge estimate={makeEstimate({ level: "short", label: "SHORT WAIT" })} />);
    expect(screen.getByText("SHORT WAIT")).toBeInTheDocument();
  });

  it("shows 'No data' for unknown level", () => {
    render(
      <WaitTimeBadge
        estimate={makeEstimate({ level: "unknown", label: "No Data", source: null })}
      />
    );
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("prefixes label with ~ when isEstimated=true", () => {
    render(
      <WaitTimeBadge
        estimate={makeEstimate({ level: "short", label: "SHORT WAIT", isEstimated: true })}
      />
    );
    expect(screen.getByText("~SHORT WAIT")).toBeInTheDocument();
  });
});

describe("WaitTimeBadge (hero mode)", () => {
  it("renders CURRENTLY CLOSED heading in hero mode", () => {
    render(
      <WaitTimeBadge
        estimate={makeEstimate({ level: "unknown" })}
        size="hero"
        isClosed={true}
      />
    );
    expect(screen.getByText("CURRENTLY CLOSED")).toBeInTheDocument();
  });

  it("shows nextOpenLabel when provided in hero closed mode", () => {
    render(
      <WaitTimeBadge
        estimate={makeEstimate({ level: "unknown" })}
        size="hero"
        isClosed={true}
        nextOpenLabel="Opens tomorrow at 8am"
      />
    );
    expect(screen.getByText("Opens tomorrow at 8am")).toBeInTheDocument();
  });

  it("shows ESTIMATED badge when isEstimated=true in hero mode", () => {
    render(
      <WaitTimeBadge
        estimate={makeEstimate({ level: "medium", label: "MEDIUM WAIT", isEstimated: true })}
        size="hero"
      />
    );
    expect(screen.getByText("ESTIMATED")).toBeInTheDocument();
  });

  it("shows 'Little to no wait' text when adjustedCount is 0 in hero mode", () => {
    render(
      <WaitTimeBadge
        estimate={makeEstimate({ level: "short", label: "SHORT WAIT", adjustedCount: 0 })}
        size="hero"
      />
    );
    expect(screen.getByText(/Little to no wait/)).toBeInTheDocument();
  });

  it("shows people count when adjustedCount > 0 in hero mode", () => {
    render(
      <WaitTimeBadge
        estimate={makeEstimate({ level: "medium", label: "MEDIUM WAIT", adjustedCount: 4, estimatedMinutes: 80 })}
        size="hero"
      />
    );
    expect(screen.getByText(/4 people in waiting room/)).toBeInTheDocument();
  });

  it("shows yesterday's average when provided in hero closed mode", () => {
    render(
      <WaitTimeBadge
        estimate={makeEstimate({ level: "unknown" })}
        size="hero"
        isClosed={true}
        yesterdayAvgMinutes={25}
      />
    );
    expect(screen.getByText(/Yesterday.*average wait.*25 min/)).toBeInTheDocument();
  });
});
