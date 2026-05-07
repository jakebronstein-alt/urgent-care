import Link from "next/link";
import { Search } from "lucide-react";

function UbieLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M16 28C16 28 4 21.6 4 12.8C4 8.97 7.13 6 11 6C13.09 6 14.96 6.93 16 8.4C17.04 6.93 18.91 6 21 6C24.87 6 28 8.97 28 12.8C28 21.6 16 28 16 28Z"
        fill="#f777a6"
      />
    </svg>
  );
}

export function UbieNav() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "saturate(180%) blur(14px)",
        WebkitBackdropFilter: "saturate(180%) blur(14px)",
        borderColor: "rgba(9,32,91,0.10)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="https://ubiehealth.com" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <UbieLogo />
            <span
              className="font-black text-lg tracking-tight"
              style={{ color: "#09205b" }}
            >
              Ubie
            </span>
          </a>
          <div className="w-px h-4 bg-outline-variant" style={{ background: "rgba(9,32,91,0.15)" }} />
          <span
            className="text-[11px] font-extrabold tracking-[0.12em] uppercase"
            style={{ color: "#8a8fa0" }}
          >
            Urgent Care
          </span>
        </div>

        <Link
          href="/urgentcare/search"
          className="flex items-center gap-1.5 text-sm font-bold transition-colors"
          style={{ color: "#3959cc" }}
        >
          <Search className="h-3.5 w-3.5" />
          Find a clinic
        </Link>
      </div>
    </header>
  );
}
