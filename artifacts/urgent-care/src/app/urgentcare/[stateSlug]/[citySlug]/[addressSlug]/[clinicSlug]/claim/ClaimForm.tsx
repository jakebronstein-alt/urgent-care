"use client";

import { useState } from "react";

interface Props {
  clinicId: string;
  clinicName: string;
}

interface FieldErrors {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  role?: string;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  return phone.replace(/\D/g, "").length >= 10;
}

export function ClaimForm({ clinicId, clinicName }: Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validate(fields: {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    role: string;
  }): FieldErrors {
    const errors: FieldErrors = {};
    if (!fields.contactName.trim()) errors.contactName = "Your name is required.";
    if (!fields.contactEmail.trim()) {
      errors.contactEmail = "Work email is required.";
    } else if (!validateEmail(fields.contactEmail)) {
      errors.contactEmail = "Please enter a valid email address.";
    }
    if (!fields.contactPhone.trim()) {
      errors.contactPhone = "Phone number is required.";
    } else if (!validatePhone(fields.contactPhone)) {
      errors.contactPhone = "Please enter a valid 10-digit phone number.";
    }
    if (!fields.role) errors.role = "Please select your role.";
    return errors;
  }

  function getFormValues(form: HTMLFormElement) {
    return {
      contactName: (form.elements.namedItem("contactName") as HTMLInputElement).value,
      contactEmail: (form.elements.namedItem("contactEmail") as HTMLInputElement).value,
      contactPhone: (form.elements.namedItem("contactPhone") as HTMLInputElement).value,
      role: (form.elements.namedItem("role") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const name = e.target.name;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const form = e.target.form;
    if (!form) return;
    const values = getFormValues(form);
    const errors = validate(values);
    setFieldErrors(errors);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = getFormValues(form);
    const errors = validate(values);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouched({ contactName: true, contactEmail: true, contactPhone: true, role: true });
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId, ...values }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Something went wrong. Please try again.");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
        <div className="text-3xl mb-3">✅</div>
        <h2 className="text-lg font-bold text-green-800 mb-1">Request received!</h2>
        <p className="text-sm text-green-700">
          We&apos;ll review your claim for <strong>{clinicName}</strong> and get back to you within 1–2 business days.
        </p>
      </div>
    );
  }

  const inputClass = (field: keyof FieldErrors) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-ubie-blue ${
      touched[field] && fieldErrors[field]
        ? "border-red-400 focus:ring-red-300"
        : "border-gray-200 focus:ring-ubie-blue/40"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-ubie-dark mb-1" htmlFor="contactName">
          Your name <span className="text-red-500">*</span>
        </label>
        <input
          id="contactName"
          name="contactName"
          type="text"
          placeholder="Jane Smith"
          className={inputClass("contactName")}
          onBlur={handleBlur}
        />
        {touched.contactName && fieldErrors.contactName && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.contactName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-ubie-dark mb-1" htmlFor="contactEmail">
          Work email <span className="text-red-500">*</span>
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          placeholder="jane@yourclinic.com"
          className={inputClass("contactEmail")}
          onBlur={handleBlur}
        />
        {touched.contactEmail && fieldErrors.contactEmail && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.contactEmail}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-ubie-dark mb-1" htmlFor="contactPhone">
          Phone number <span className="text-red-500">*</span>
        </label>
        <input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          placeholder="(212) 555-0100"
          className={inputClass("contactPhone")}
          onBlur={handleBlur}
        />
        {touched.contactPhone && fieldErrors.contactPhone && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.contactPhone}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-ubie-dark mb-1" htmlFor="role">
          Your role <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          name="role"
          className={`${inputClass("role")} bg-white`}
          onBlur={handleBlur}
        >
          <option value="">Select a role…</option>
          <option value="owner">Owner</option>
          <option value="manager">Practice Manager</option>
          <option value="admin">Administrative Staff</option>
          <option value="other">Other</option>
        </select>
        {touched.role && fieldErrors.role && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.role}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-ubie-dark mb-1" htmlFor="message">
          Anything else we should know?{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          placeholder="E.g. best time to reach you, or how you'd like to verify ownership"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ubie-blue/40 focus:border-ubie-blue resize-none"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-[30px] bg-ubie-blue text-white font-bold py-3 text-sm hover:bg-ubie-blue/90 transition-colors disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Submit claim request"}
      </button>

      <p className="text-center text-xs text-gray-400">
        Fields marked <span className="text-red-500">*</span> are required
      </p>
    </form>
  );
}
