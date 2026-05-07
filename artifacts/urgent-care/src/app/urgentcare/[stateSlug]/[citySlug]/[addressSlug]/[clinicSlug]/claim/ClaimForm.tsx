"use client";

import { useState } from "react";

interface Props {
  clinicId: string;
  clinicName: string;
}

export function ClaimForm({ clinicId, clinicName }: Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = {
      clinicId,
      contactName: (form.elements.namedItem("contactName") as HTMLInputElement).value,
      contactEmail: (form.elements.namedItem("contactEmail") as HTMLInputElement).value,
      contactPhone: (form.elements.namedItem("contactPhone") as HTMLInputElement).value,
      role: (form.elements.namedItem("role") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-ubie-dark mb-1" htmlFor="contactName">
          Your name
        </label>
        <input
          id="contactName"
          name="contactName"
          type="text"
          required
          placeholder="Jane Smith"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ubie-blue/40 focus:border-ubie-blue"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ubie-dark mb-1" htmlFor="contactEmail">
          Work email
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          required
          placeholder="jane@yourclinic.com"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ubie-blue/40 focus:border-ubie-blue"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ubie-dark mb-1" htmlFor="contactPhone">
          Phone number
        </label>
        <input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          required
          placeholder="(212) 555-0100"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ubie-blue/40 focus:border-ubie-blue"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ubie-dark mb-1" htmlFor="role">
          Your role
        </label>
        <select
          id="role"
          name="role"
          required
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ubie-blue/40 focus:border-ubie-blue bg-white"
        >
          <option value="">Select a role…</option>
          <option value="owner">Owner</option>
          <option value="manager">Practice Manager</option>
          <option value="admin">Administrative Staff</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ubie-dark mb-1" htmlFor="message">
          Anything else we should know? <span className="font-normal text-gray-400">(optional)</span>
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
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-[30px] bg-ubie-blue text-white font-bold py-3 text-sm hover:bg-ubie-blue/90 transition-colors disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Submit claim request"}
      </button>
    </form>
  );
}
