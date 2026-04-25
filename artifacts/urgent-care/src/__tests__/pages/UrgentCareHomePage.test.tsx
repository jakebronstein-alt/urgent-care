import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UrgentCareHomePage from "@/app/urgent-care/page";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/urgent-care",
  useSearchParams: () => new URLSearchParams(),
}));

describe("UrgentCareHomePage", () => {
  it("renders the main heading", () => {
    render(<UrgentCareHomePage />);
    expect(screen.getByRole("heading", { name: /Find Urgent Care Near You/i })).toBeInTheDocument();
  });

  it("renders the location search input", () => {
    render(<UrgentCareHomePage />);
    expect(
      screen.getByPlaceholderText(/neighborhood, zip code, or city/i)
    ).toBeInTheDocument();
  });

  it("renders the search button", () => {
    render(<UrgentCareHomePage />);
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("points the search form at /urgent-care/search", () => {
    const { container } = render(<UrgentCareHomePage />);
    const formEl = container.querySelector("form[action='/urgent-care/search']");
    expect(formEl).not.toBeNull();
  });

  it("shows the 'Browse by area' section heading", () => {
    render(<UrgentCareHomePage />);
    expect(screen.getByText("Browse by area")).toBeInTheDocument();
  });

  it("renders all featured city links", () => {
    render(<UrgentCareHomePage />);
    expect(screen.getByText("Manhattan, NY")).toBeInTheDocument();
    expect(screen.getByText("Brooklyn, NY")).toBeInTheDocument();
    expect(screen.getByText("The Bronx, NY")).toBeInTheDocument();
    expect(screen.getByText("Staten Island, NY")).toBeInTheDocument();
    expect(screen.getByText("Jersey City, NJ")).toBeInTheDocument();
  });

  it("links Manhattan to the correct city URL", () => {
    render(<UrgentCareHomePage />);
    const manhattanLink = screen.getByText("Manhattan, NY").closest("a");
    expect(manhattanLink).toHaveAttribute("href", "/urgent-care/ny/new-york");
  });

  it("shows the 'Search by service' section heading", () => {
    render(<UrgentCareHomePage />);
    expect(screen.getByText("Search by service")).toBeInTheDocument();
  });

  it("renders the service filter pills", () => {
    render(<UrgentCareHomePage />);
    expect(screen.getByRole("button", { name: "X-Ray" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "COVID Testing" })).toBeInTheDocument();
  });

  it("renders the symptom checker CTA", () => {
    render(<UrgentCareHomePage />);
    expect(screen.getByText(/Start a symptom check/i)).toBeInTheDocument();
  });
});
