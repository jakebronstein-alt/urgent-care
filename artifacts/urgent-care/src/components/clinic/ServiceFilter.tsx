"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export const COMMON_SERVICES = [
  "X-Ray",
  "COVID Testing",
  "Pediatrics",
  "Lab Tests",
  "STI Testing",
  "Sports Medicine",
  "Physicals",
  "Travel Medicine",
  "Laceration Repair",
  "Occupational Health",
];

interface Props {
  /** "filter" = toggle ?service= on current page; "search" = navigate to /urgent-care/search?service= */
  mode: "filter" | "search";
  /** Services to show as chips — defaults to COMMON_SERVICES */
  services?: string[];
  /** Current active service (passed from server for filter mode) */
  activeService?: string | null;
}

export function ServiceFilter({ mode, services = COMMON_SERVICES, activeService }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = activeService ?? searchParams.get("service");

  function handleClick(service: string) {
    if (mode === "search") {
      router.push(`/urgent-care/search?service=${encodeURIComponent(service)}`);
      return;
    }
    // filter mode: toggle on current page
    const params = new URLSearchParams(searchParams.toString());
    if (current === service) {
      params.delete("service");
    } else {
      params.set("service", service);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Filter by service
      </p>
      <div className="flex flex-wrap gap-2">
        {services.map((service) => {
          const isActive = current === service;
          return (
            <button
              key={service}
              onClick={() => handleClick(service)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-ubie-blue border-ubie-blue text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-ubie-blue hover:text-ubie-blue"
              }`}
            >
              {service}
            </button>
          );
        })}
        {current && mode === "filter" && (
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("service");
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
          >
            ✕ Clear filter
          </button>
        )}
      </div>
    </div>
  );
}
