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
    <div className="rounded-2xl border border-ubie-blue/20 bg-white overflow-hidden">
      {/* Pink accent bar */}
      <div className="h-1 w-full bg-ubie-pink" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Ubie mascot placeholder */}
          <div className="shrink-0 h-12 w-12 rounded-full bg-ubie-blue-light flex items-center justify-center text-2xl">
            🐕
          </div>
          <div>
            <h3 className="font-bold text-ubie-dark text-base leading-snug">
              Check your symptoms &amp; find possible causes while you wait!
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Free · Just 3 minutes · Medical Grade AI - Developed by Doctors - Trusted by 13M users
            </p>
          </div>
        </div>

        {/* Value prop */}

        {/* Quick-start symptom chips */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Start by selecting a symptom
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_SYMPTOMS.map((symptom) => (
            <a
              key={symptom}
              href={`${baseUrl}?symptom=${encodeURIComponent(symptom.toLowerCase())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-ubie-blue/30 bg-ubie-blue-light px-3 py-1 text-xs font-medium text-ubie-blue hover:bg-ubie-blue hover:text-white transition-colors"
            >
              {symptom}
            </a>
          ))}
        </div>

        {/* Main CTA button */}
        <a
          href={baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-[30px] bg-ubie-blue text-white py-3 text-sm font-bold hover:bg-ubie-blue/90 transition-colors shadow-sm"
        >
          Start a symptom check
          <ArrowRight className="h-4 w-4" />
        </a>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
          <span>50K+ clinical sources</span>
          <span>·</span>
          <span>50+ medical experts</span>
          <span>·</span>
          <span>71.6% accuracy</span>
        </div>

        {/* Testimonials */}
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="rounded-xl bg-ubie-pink-light px-3 py-2">
              <div className="flex gap-0.5 mb-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className="h-3 w-3 fill-ubie-pink text-ubie-pink" />
                ))}
              </div>
              <p className="text-xs text-gray-600 italic">&ldquo;{t.text}&rdquo;</p>
              <p className="text-xs text-gray-400 mt-0.5">— {t.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
