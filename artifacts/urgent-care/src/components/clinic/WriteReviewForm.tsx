"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";

// ── Madlibs options ────────────────────────────────────────────────────────────

const REASONS = [
  "a cold or flu",
  "an injury",
  "COVID testing",
  "lab work",
  "an X-ray",
  "an STI test",
  "a physical exam",
  "stomach pain",
  "a rash or skin issue",
  "chest pain",
  "a headache or migraine",
  "back pain",
  "something else",
];

const DAYS = [
  "today",
  "yesterday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIMES = [
  "early morning (before 8am)",
  "mid-morning (8–11am)",
  "lunchtime (11am–2pm)",
  "the afternoon (2–5pm)",
  "the evening (5–8pm)",
  "late at night (after 8pm)",
];

const DURATIONS = [
  "less than 15 minutes",
  "about 15–30 minutes",
  "about 30–45 minutes",
  "about 45–60 minutes",
  "over an hour",
  "over 2 hours",
];

const QUALITIES = [
  "excellent — I couldn't be happier",
  "good — I'd recommend it",
  "ok — nothing special",
  "poor — had some issues",
  "bad — I would not return",
];

// ── Inline select ──────────────────────────────────────────────────────────────

function InlineSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`inline-block appearance-none bg-transparent border-b-2 font-semibold cursor-pointer focus:outline-none px-0.5 mx-0.5 ${
        value
          ? "border-ubie-blue text-ubie-blue"
          : "border-gray-300 text-gray-400"
      }`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ── Star picker ────────────────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <span className="inline-flex items-center gap-0.5 mx-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              n <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1 text-sm font-semibold text-ubie-dark border-b-2 border-ubie-blue">
          {["", "1 star", "2 stars", "3 stars", "4 stars", "5 stars"][value]}
        </span>
      )}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  clinicId: string;
  isFirst?: boolean;
}

type Step = "idle" | "form" | "phone" | "done";

export function WriteReviewForm({ clinicId, isFirst }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [reason, setReason] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [quality, setQuality] = useState("");
  const [rating, setRating] = useState(0);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formComplete = reason && day && time && duration && quality && rating > 0;

  function buildBody() {
    return `I came in for ${reason} at ${day} around ${time}. The wait was about ${duration}. The service was ${quality}.`;
  }

  async function handleSubmit() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId, phone: digits, rating, body: buildBody() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── Idle: trigger button ───────────────────────────────────────────────────
  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("form")}
        className="w-full rounded-2xl border-2 border-dashed border-ubie-blue/30 py-5 text-ubie-blue font-semibold text-sm hover:border-ubie-blue hover:bg-ubie-blue-light transition-all"
      >
        {isFirst ? "⭐ Be the first to review this clinic" : "✏️ Write a review"}
      </button>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-6 text-center">
        <p className="text-2xl mb-1">🎉</p>
        <p className="font-semibold text-ubie-dark">Review submitted — thank you!</p>
        <p className="text-sm text-gray-500 mt-1">
          Your review will appear shortly after a quick check.
        </p>
      </div>
    );
  }

  // ── Form: madlibs ─────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="rounded-2xl border border-ubie-blue/20 bg-ubie-blue-light/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-ubie-dark">Write your review</p>
          <button
            onClick={() => setStep("idle")}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Madlibs sentence */}
        <div className="text-base leading-[2.4] text-ubie-dark bg-white rounded-xl border border-ubie-blue/10 px-5 py-4">
          <span>I came in for</span>
          <InlineSelect
            value={reason}
            onChange={setReason}
            options={REASONS}
            placeholder="choose one"
          />
          <span>at</span>
          <InlineSelect
            value={day}
            onChange={setDay}
            options={DAYS}
            placeholder="day"
          />
          <span>around</span>
          <InlineSelect
            value={time}
            onChange={setTime}
            options={TIMES}
            placeholder="time of day"
          />
          <span>. The wait was about</span>
          <InlineSelect
            value={duration}
            onChange={setDuration}
            options={DURATIONS}
            placeholder="how long"
          />
          <span>. The service was</span>
          <InlineSelect
            value={quality}
            onChange={setQuality}
            options={QUALITIES}
            placeholder="how was it"
          />
          <span>. I give this place</span>
          <StarPicker value={rating} onChange={setRating} />
          <span>.</span>
        </div>

        <button
          onClick={() => setStep("phone")}
          disabled={!formComplete}
          className="mt-4 w-full rounded-[30px] bg-ubie-blue text-white py-3 text-sm font-semibold hover:bg-ubie-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    );
  }

  // ── Phone: account creation ───────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-ubie-blue/20 bg-ubie-blue-light/40 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-ubie-dark">One last step</p>
        <button
          onClick={() => setStep("form")}
          className="text-xs text-gray-400 hover:text-ubie-blue"
        >
          ← Back
        </button>
      </div>

      {/* Preview of what they wrote */}
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 mb-4">
        <div className="flex mb-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-4 w-4 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600">{buildBody()}</p>
      </div>

      <p className="text-sm text-gray-500 mb-3">
        Enter your phone number to post your review. We use it to prevent duplicates — we won&apos;t spam you.
      </p>

      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="(555) 555-5555"
        autoFocus
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ubie-blue/40 focus:border-ubie-blue mb-3"
      />

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading || phone.replace(/\D/g, "").length < 10}
        className="w-full rounded-[30px] bg-ubie-blue text-white py-3 text-sm font-semibold hover:bg-ubie-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting…" : "Post my review"}
      </button>
    </div>
  );
}
