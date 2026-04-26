import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClaimForm } from "@/app/urgent-care/[stateSlug]/[citySlug]/[addressSlug]/[clinicSlug]/claim/ClaimForm";

describe("ClaimForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all required form fields", () => {
    render(<ClaimForm clinicId="clinic-1" clinicName="Acme Urgent Care" />);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/anything else/i)).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<ClaimForm clinicId="clinic-1" clinicName="Acme Urgent Care" />);
    expect(screen.getByRole("button", { name: /submit claim request/i })).toBeInTheDocument();
  });

  it("accepts text input in the name field", async () => {
    render(<ClaimForm clinicId="clinic-1" clinicName="Acme Urgent Care" />);
    const nameInput = screen.getByLabelText(/your name/i);
    await userEvent.type(nameInput, "Jane Smith");
    expect(nameInput).toHaveValue("Jane Smith");
  });

  it("accepts email input in the email field", async () => {
    render(<ClaimForm clinicId="clinic-1" clinicName="Acme Urgent Care" />);
    const emailInput = screen.getByLabelText(/work email/i);
    await userEvent.type(emailInput, "jane@clinic.com");
    expect(emailInput).toHaveValue("jane@clinic.com");
  });

  it("accepts phone input in the phone field", async () => {
    render(<ClaimForm clinicId="clinic-1" clinicName="Acme Urgent Care" />);
    const phoneInput = screen.getByLabelText(/phone number/i);
    await userEvent.type(phoneInput, "(212) 555-0100");
    expect(phoneInput).toHaveValue("(212) 555-0100");
  });

  it("allows selecting a role", () => {
    render(<ClaimForm clinicId="clinic-1" clinicName="Acme Urgent Care" />);
    const roleSelect = screen.getByLabelText(/your role/i);
    fireEvent.change(roleSelect, { target: { value: "owner" } });
    expect(roleSelect).toHaveValue("owner");
  });

  it("accepts optional message input", async () => {
    render(<ClaimForm clinicId="clinic-1" clinicName="Acme Urgent Care" />);
    const messageField = screen.getByLabelText(/anything else/i);
    await userEvent.type(messageField, "Please call after 3pm");
    expect(messageField).toHaveValue("Please call after 3pm");
  });

  it("calls /api/claims with the correct payload on form submission", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<ClaimForm clinicId="clinic-42" clinicName="Acme Urgent Care" />);

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Jane Smith" } });
    fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: "jane@clinic.com" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "(212) 555-0100" } });
    fireEvent.change(screen.getByLabelText(/your role/i), { target: { value: "owner" } });
    fireEvent.change(screen.getByLabelText(/anything else/i), { target: { value: "Best time to call: mornings" } });

    fireEvent.submit(screen.getByRole("button", { name: /submit claim request/i }).closest("form")!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/claims",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.clinicId).toBe("clinic-42");
      expect(body.contactName).toBe("Jane Smith");
      expect(body.contactEmail).toBe("jane@clinic.com");
      expect(body.contactPhone).toBe("(212) 555-0100");
      expect(body.role).toBe("owner");
      expect(body.message).toBe("Best time to call: mornings");
    });
  });

  it("shows success state after a successful submission", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    render(<ClaimForm clinicId="clinic-1" clinicName="Acme Urgent Care" />);

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Jane Smith" } });
    fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: "jane@clinic.com" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "(212) 555-0100" } });
    fireEvent.change(screen.getByLabelText(/your role/i), { target: { value: "manager" } });

    fireEvent.submit(screen.getByRole("button", { name: /submit claim request/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/request received/i)).toBeInTheDocument();
      expect(screen.getByText(/acme urgent care/i)).toBeInTheDocument();
    });
  });

  it("shows an error message when the API returns a non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "This clinic has already been claimed." }),
    }));

    render(<ClaimForm clinicId="clinic-1" clinicName="Acme Urgent Care" />);

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Jane Smith" } });
    fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: "jane@clinic.com" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "(212) 555-0100" } });
    fireEvent.change(screen.getByLabelText(/your role/i), { target: { value: "owner" } });

    fireEvent.submit(screen.getByRole("button", { name: /submit claim request/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("This clinic has already been claimed.")).toBeInTheDocument();
    });
  });

  it("disables the submit button while submitting", async () => {
    let resolveRequest!: (value: unknown) => void;
    const pendingRequest = new Promise((res) => { resolveRequest = res; });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pendingRequest));

    render(<ClaimForm clinicId="clinic-1" clinicName="Acme Urgent Care" />);

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Jane Smith" } });
    fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: "jane@clinic.com" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "(212) 555-0100" } });
    fireEvent.change(screen.getByLabelText(/your role/i), { target: { value: "owner" } });

    fireEvent.submit(screen.getByRole("button", { name: /submit claim request/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
    });

    resolveRequest({ ok: true, json: async () => ({ ok: true }) });
  });
});
