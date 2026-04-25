"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

const DELAY_MS = 5000;

export function UbieConsultPopup() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    setTimeout(() => setDismissed(true), 300);
  }

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[520px] transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      {/* Shiba mascot peeking above the card */}
      <div className="relative pt-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
          <Image src="/shiba_blink.svg" alt="Ubie" width={64} height={59} />
        </div>

        {/* Card */}
        <div
          className="bg-gradient-to-r from-blue-200 via-blue-50 to-pink-200 shadow-lg px-4 pt-6 pb-4 relative flex flex-col items-center gap-2 overflow-hidden"
          style={{ borderRadius: "20px" }}
        >
          {/* Dismiss */}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Headline */}
          <p className="text-base font-bold text-gray-900 text-center leading-snug">
            Have a health question?{" "}
            <span className="text-blue-900">DON&apos;T ASK CHATGPT.</span>
          </p>

          {/* CTA button */}
          <a
            href="https://ubiehealth.com/consult/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-900 text-white px-10 py-3 rounded-full font-bold text-sm hover:bg-blue-950 transition-colors mt-1"
          >
            ASK ME INSTEAD
          </a>

          {/* Sub-copy */}
          <p className="text-xs text-gray-500 text-center">
            Medically validated. Doctor Approved. Trusted by 13M+
          </p>
        </div>
      </div>
    </div>
  );
}
