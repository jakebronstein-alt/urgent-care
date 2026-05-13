import Link from "next/link";
import { Search } from "lucide-react";

function UbieHeart() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 28.5C16 28.5 2 20 2 11.5C2 7.36 5.13 4 9 4C11.34 4 13.44 5.16 16 8C18.56 5.16 20.66 4 23 4C26.87 4 30 7.36 30 11.5C30 20 16 28.5 16 28.5Z"
        fill="#F26E9B"
      />
      <path
        d="M16 22.5C16 22.5 9 17.8 9 13.2C9 11.04 10.57 9.3 12.5 9.3C13.84 9.3 14.96 10.1 16 11.4C17.04 10.1 18.16 9.3 19.5 9.3C21.43 9.3 23 11.04 23 13.2C23 17.8 16 22.5 16 22.5Z"
        fill="white"
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
          <a href="https://ubiehealth.com/urgentcare" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <UbieHeart />
            <span
              className="font-black text-lg tracking-tight"
              style={{ color: "#09205b" }}
            >
              Ubie
            </span>
          </a>
          <div className="w-px h-4" style={{ background: "rgba(9,32,91,0.15)" }} />
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
