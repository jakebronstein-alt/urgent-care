"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, CheckCircle, ArrowRight, Phone, MessageCircleHeart } from "lucide-react";

const COUNTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const VISIT_REASONS = [
  "Cold / Flu symptoms",
  "Fever",
  "Injury or sprain",
  "Cut or wound",
  "Stomach pain / nausea",
  "Ear, sinus, or throat",
  "COVID concern",
  "Rash or skin issue",
  "Chest pain",
  "Other",
];

type Step = "count" | "phone" | "reason" | "followup" | "done";

interface Props {
  clinicId: string;
  clinicName: string;
}

export function ReportWaitForm({ clinicId, clinicName }: Props) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("count");
  const [selected, setSelected] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [visitReason, setVisitReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");

  async function handlePhoneSubmit() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setPhoneError("Please enter a valid 10-digit US phone number.");
      return;
    }
    setPhoneError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/wait-times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId,
          peopleCount: selected,
          source: "CROWDSOURCED_WEB",
          phone,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setPhoneError(data.message ?? "Too many recent reports from this number. Please wait 30 minutes.");
        return;
      }
      if (!res.ok) {
        setPhoneError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setReportId(data.reportId);
      setStep("reason");
    } catch {
      setPhoneError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFollowUpSubmit(optedIn: boolean) {
    setSubmitting(true);
    try {
      if (reportId) {
        await fetch("/api/follow-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId, clinicId, phone, visitReason, optedIn }),
        });
      }
    } finally {
      setSubmitting(false);
      setStep("done");
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────

  if (step === "done") {
    setTimeout(() => router.back(), 2500);
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle className="h-10 w-10 text-green-500" />
        <p className="font-semibold text-ubie-dark">You&apos;re all set — thank you!</p>
        <p className="text-sm text-gray-400">Taking you back to the clinic page…</p>
      </div>
    );
  }

  // ── Progress dots ─────────────────────────────────────────────────────────

  const STEP_ORDER: Step[] = ["count", "phone", "reason", "followup"];
  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        {STEP_ORDER.map((s, i) => (
          <div
            key={s}
            className={`rounded-full transition-all ${
              i < stepIndex
                ? "h-2 w-2 bg-ubie-blue"
                : i === stepIndex
                ? "h-2 w-5 bg-ubie-blue"
                : "h-2 w-2 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: count picker ── */}
      {step === "count" && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-2">
            {COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setSelected(n)}
                className={`rounded-2xl border py-3 text-lg font-semibold transition-all ${
                  selected === n
                    ? "border-ubie-blue bg-ubie-blue text-white shadow-sm"
                    : "border-gray-200 text-ubie-dark hover:border-ubie-blue hover:text-ubie-blue"
                }`}
              >
                {n}{n === 10 && "+"}
              </button>
            ))}
          </div>

          {selected !== null && (
            <p className="text-sm text-center text-gray-500 flex items-center justify-center gap-1.5">
              <Users className="h-4 w-4" />
              {selected === 0
                ? "Little to no wait"
                : `${selected}${selected === 10 ? "+" : ""} ${selected === 1 ? "person" : "people"} waiting`}
            </p>
          )}

          <button
            onClick={() => setStep("phone")}
            disabled={selected === null}
            className="w-full rounded-[30px] bg-ubie-blue text-white py-3 font-semibold text-sm hover:bg-ubie-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Step 2: phone verification ── */}
      {step === "phone" && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl bg-ubie-blue-light border border-ubie-blue/20 p-4">
            <Phone className="h-5 w-5 text-ubie-blue shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ubie-dark">Quick verification</p>
              <p className="text-xs text-gray-500 mt-0.5">
                We use your number only to keep wait times accurate — one person, one report. We won&apos;t call or spam you.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ubie-dark mb-1.5" htmlFor="reporter-phone">
              Your phone number
            </label>
            <input
              id="reporter-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
              placeholder="(212) 555-0100"
              autoComplete="tel"
              className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ubie-blue/40 focus:border-ubie-blue ${
                phoneError ? "border-red-300" : "border-gray-200"
              }`}
            />
            {phoneError && <p className="text-xs text-red-500 mt-1.5">{phoneError}</p>}
          </div>

          <button
            onClick={handlePhoneSubmit}
            disabled={submitting || phone.replace(/\D/g, "").length < 10}
            className="w-full rounded-[30px] bg-ubie-blue text-white py-3 font-semibold text-sm hover:bg-ubie-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting…" : "Submit wait time"}
          </button>
        </div>
      )}

      {/* ── Step 3: reason for visit ── */}
      {step === "reason" && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            Your wait time has been recorded — thank you! One quick question:
          </p>

          <div>
            <p className="text-sm font-semibold text-ubie-dark mb-3">
              What brought you in today?
            </p>
            <div className="flex flex-wrap gap-2">
              {VISIT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setVisitReason(reason === visitReason ? null : reason)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    visitReason === reason
                      ? "bg-ubie-blue border-ubie-blue text-white"
                      : "border-gray-200 text-gray-600 hover:border-ubie-blue hover:text-ubie-blue"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            {visitReason === "Other" && (
              <textarea
                autoFocus
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Please describe what brought you in…"
                rows={3}
                className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ubie-blue/40 focus:border-ubie-blue resize-none"
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                const finalReason = visitReason === "Other" ? otherReason.trim() || "Other" : visitReason;
                setVisitReason(finalReason);
                setStep("followup");
              }}
              disabled={visitReason === "Other" && otherReason.trim() === ""}
              className="w-full rounded-[30px] bg-ubie-blue text-white py-3 font-semibold text-sm hover:bg-ubie-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setVisitReason(null); setStep("followup"); }}
              className="text-xs text-gray-400 hover:text-gray-600 text-center py-1"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: follow-up opt-in ── */}
      {step === "followup" && (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <MessageCircleHeart className="h-6 w-6 text-ubie-pink shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ubie-dark">
                Can we follow up with you tomorrow?
              </p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Based on what brought you in{visitReason ? ` (${visitReason.toLowerCase()})` : ""},
                Ubie can send you personalized health guidance — plus a quick link to share your
                experience at {clinicName} once you&apos;ve been seen.
              </p>
            </div>
          </div>

          <ul className="space-y-1.5 pl-2">
            {[
              "Personalized health tips from Ubie's medical team",
              `A simple way to review ${clinicName}`,
              "One message, 24 hours from now — that's it",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="text-ubie-blue mt-0.5 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleFollowUpSubmit(true)}
              disabled={submitting}
              className="w-full rounded-[30px] bg-ubie-blue text-white py-3 font-semibold text-sm hover:bg-ubie-blue/90 disabled:opacity-40 transition-colors"
            >
              {submitting ? "Saving…" : "Yes, send me tips in 24 hours"}
            </button>
            <button
              onClick={() => handleFollowUpSubmit(false)}
              disabled={submitting}
              className="text-xs text-gray-400 hover:text-gray-600 text-center py-1"
            >
              No thanks, skip
            </button>
          </div>

          <p className="text-xs text-gray-300 text-center">
            By opting in you agree to receive one SMS from UbieHealth. Standard rates apply.
          </p>
        </div>
      )}
    </div>
  );
}
