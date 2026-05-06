import { ArrowRight, Star } from "lucide-react";

const QUICK_SYMPTOMS = [
  "Headache", "Cough", "Fever", "Stomach pain",
  "Chest pain", "Sore throat", "Dizziness", "Rash",
];

const TESTIMONIALS = [
  {
    text: "It matched my lupus symptoms accurately when I'd been dismissed for months.",
    label: "Patient, 30s",
  },
  {
    text: "Thorough and balanced — helped me decide if my chest pain needed the ER or urgent care.",
    label: "Patient, 50s",
  },
];

export function SymptomCheckerCTA() {
  const baseUrl = "https://ubiehealth.com/symptom-checker";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(9,32,91,0.10)", boxShadow: "0 1px 3px rgba(9,32,91,0.07)" }}
    >
      {/* Pink top accent bar */}
      <div className="h-1 w-full" style={{ background: "#f777a6" }} />

      <div className="bg-white p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className="shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "#fde8f1" }}
          >
            🐕
          </div>
          <div>
            <p className="text-xs font-extrabold tracking-[0.10em] uppercase mb-1" style={{ color: "#3959cc" }}>
              While you wait
            </p>
            <h3 className="font-black leading-snug" style={{ color: "#09205b", fontSize: "1.0625rem", letterSpacing: "-0.01em" }}>
              Check your symptoms &amp; find possible causes
            </h3>
            <p className="text-xs mt-1" style={{ color: "#8a8fa0" }}>
              Free · 3 minutes · Medical Grade AI · Trusted by 13M+ users
            </p>
          </div>
        </div>

        {/* Quick-start symptom chips */}
        <p className="text-xs font-extrabold tracking-[0.10em] uppercase mb-2.5" style={{ color: "#8a8fa0" }}>
          Start by selecting a symptom
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {QUICK_SYMPTOMS.map((symptom) => (
            <a
              key={symptom}
              href={`${baseUrl}?symptom=${encodeURIComponent(symptom.toLowerCase())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full text-xs font-semibold px-3 py-1.5 transition-colors"
              style={{
                background: "#e8ecf9",
                color: "#3959cc",
                border: "1px solid rgba(57,89,204,0.18)",
              }}
            >
              {symptom}
            </a>
          ))}
        </div>

        {/* CTA button */}
        <a
          href={baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-full text-white py-3.5 text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: "#09205b" }}
        >
          Start a symptom check
          <ArrowRight className="h-4 w-4" />
        </a>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs font-medium" style={{ color: "#aaabac" }}>
          <span>50K+ clinical sources</span>
          <span>·</span>
          <span>50+ medical experts</span>
          <span>·</span>
          <span>71.6% accuracy</span>
        </div>

        {/* Testimonials */}
        <div className="mt-5 space-y-2.5 pt-5" style={{ borderTop: "1px solid rgba(9,32,91,0.08)" }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="rounded-xl px-4 py-3" style={{ background: "#fde8f1" }}>
              <div className="flex gap-0.5 mb-1.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className="h-3 w-3" style={{ fill: "#f777a6", color: "#f777a6" }} />
                ))}
              </div>
              <p className="text-xs italic" style={{ color: "#5a6070" }}>&ldquo;{t.text}&rdquo;</p>
              <p className="text-xs mt-1" style={{ color: "#aaabac" }}>— {t.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
