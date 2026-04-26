import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WriteReviewForm } from "@/components/clinic/WriteReviewForm";

function fillMadlibs() {
  const selects = screen.getAllByRole("combobox");
  fireEvent.change(selects[0], { target: { value: "a cold or flu" } });
  fireEvent.change(selects[1], { target: { value: "today" } });
  fireEvent.change(selects[2], { target: { value: "early morning (before 8am)" } });
  fireEvent.change(selects[3], { target: { value: "less than 15 minutes" } });
  fireEvent.change(selects[4], { target: { value: "excellent — I couldn't be happier" } });
}

function getStarButtons() {
  return screen.getAllByRole("button").filter(
    (b) => b.querySelector("svg.h-6")
  );
}

describe("WriteReviewForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the trigger button by default", () => {
    render(<WriteReviewForm clinicId="clinic-1" />);
    expect(screen.getByRole("button", { name: /write a review/i })).toBeInTheDocument();
  });

  it("shows 'Be the first to review' when isFirst is true", () => {
    render(<WriteReviewForm clinicId="clinic-1" isFirst />);
    expect(screen.getByRole("button", { name: /be the first to review/i })).toBeInTheDocument();
  });

  it("opens the form when the trigger button is clicked", async () => {
    render(<WriteReviewForm clinicId="clinic-1" />);
    await userEvent.click(screen.getByRole("button", { name: /write a review/i }));
    expect(screen.getByText("Write your review")).toBeInTheDocument();
  });

  it("blocks submission when no fields are filled (Next button is disabled)", async () => {
    render(<WriteReviewForm clinicId="clinic-1" />);
    await userEvent.click(screen.getByRole("button", { name: /write a review/i }));

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it("enables Next button only when all fields are filled", async () => {
    render(<WriteReviewForm clinicId="clinic-1" />);
    await userEvent.click(screen.getByRole("button", { name: /write a review/i }));

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeDisabled();

    fillMadlibs();

    // Star buttons render with h-6 w-6 SVGs; click the 5th (index 4)
    fireEvent.click(getStarButtons()[4]);

    expect(nextButton).not.toBeDisabled();
  });

  it("advances to phone step when Next is clicked after filling all fields", async () => {
    render(<WriteReviewForm clinicId="clinic-1" />);
    await userEvent.click(screen.getByRole("button", { name: /write a review/i }));

    fillMadlibs();
    fireEvent.click(getStarButtons()[2]); // any star (3 stars) is enough

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("One last step")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("(555) 555-5555")).toBeInTheDocument();
  });

  it("submit button is disabled when phone is too short", async () => {
    render(<WriteReviewForm clinicId="clinic-1" />);
    await userEvent.click(screen.getByRole("button", { name: /write a review/i }));

    fillMadlibs();
    fireEvent.click(getStarButtons()[1]); // 2 stars

    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    fireEvent.change(screen.getByPlaceholderText("(555) 555-5555"), { target: { value: "123" } });
    expect(screen.getByRole("button", { name: /post my review/i })).toBeDisabled();
  });

  it("calls /api/reviews with correct payload on valid submission", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<WriteReviewForm clinicId="clinic-123" />);
    await userEvent.click(screen.getByRole("button", { name: /write a review/i }));

    fillMadlibs();
    fireEvent.click(getStarButtons()[4]); // 5 stars → rating 5

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.change(screen.getByPlaceholderText("(555) 555-5555"), { target: { value: "5551234567" } });
    await userEvent.click(screen.getByRole("button", { name: /post my review/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/reviews",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.clinicId).toBe("clinic-123");
      expect(body.phone).toBe("5551234567");
      expect(body.rating).toBe(5);
      expect(body.body).toContain("a cold or flu");
    });
  });

  it("shows success state after a successful submission", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    }));

    render(<WriteReviewForm clinicId="clinic-123" />);
    await userEvent.click(screen.getByRole("button", { name: /write a review/i }));

    fillMadlibs();
    fireEvent.click(getStarButtons()[3]); // 4 stars

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.change(screen.getByPlaceholderText("(555) 555-5555"), { target: { value: "5551234567" } });
    await userEvent.click(screen.getByRole("button", { name: /post my review/i }));

    await waitFor(() => {
      expect(screen.getByText(/review submitted/i)).toBeInTheDocument();
    });
  });

  it("shows an error message when the API returns an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "You've already reviewed this clinic." }),
    }));

    render(<WriteReviewForm clinicId="clinic-123" />);
    await userEvent.click(screen.getByRole("button", { name: /write a review/i }));

    fillMadlibs();
    fireEvent.click(getStarButtons()[3]); // 4 stars

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.change(screen.getByPlaceholderText("(555) 555-5555"), { target: { value: "5551234567" } });
    await userEvent.click(screen.getByRole("button", { name: /post my review/i }));

    await waitFor(() => {
      expect(screen.getByText("You've already reviewed this clinic.")).toBeInTheDocument();
    });
  });

  it("closes the form when the X button is clicked", async () => {
    render(<WriteReviewForm clinicId="clinic-1" />);
    await userEvent.click(screen.getByRole("button", { name: /write a review/i }));
    expect(screen.getByText("Write your review")).toBeInTheDocument();

    // The X close button has a h-4 w-4 SVG; star buttons use h-6 w-6
    const closeButton = screen.getAllByRole("button").find(
      (b) => b.querySelector("svg.h-4")
    )!;
    await userEvent.click(closeButton);
    expect(screen.getByRole("button", { name: /write a review/i })).toBeInTheDocument();
  });
});
