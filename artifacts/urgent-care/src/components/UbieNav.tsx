import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

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
          <a
            href="https://ubiehealth.com/urgentcare"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <Image
              src="/urgentcare/ubie-logo-horizontal.png"
              alt="Ubie"
              width={88}
              height={36}
              priority
              style={{ height: 28, width: "auto" }}
              unoptimized
            />
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
