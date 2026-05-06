import Link from "next/link";
import { MapPin, Phone, Star, Clock } from "lucide-react";
import { WaitTimeBadge } from "./WaitTimeBadge";
import { WaitTimeEstimate, ClinicCapacity } from "@/lib/wait-time";

export interface ClinicCardData {
  id: string;
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  stateSlug: string;
  citySlug: string;
  addressSlug: string;
  clinicSlug: string;
  avgRating?: number | null;
  reviewCount?: number;
  waitEstimate: WaitTimeEstimate;
  capacity?: ClinicCapacity;
  isOpenNow?: boolean;
  isClosed?: boolean;
}

interface Props {
  clinic: ClinicCardData;
}

export function ClinicCard({ clinic }: Props) {
  const href = `/urgent-care/${clinic.stateSlug}/${clinic.citySlug}/${clinic.addressSlug}/${clinic.clinicSlug}`;

  return (
    <Link href={href} className="block group">
      <div className="uc-clinic-card bg-white rounded-xl p-4 transition-all duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold truncate transition-colors group-hover:text-ubie-blue-600"
              style={{ color: "#09205b", fontSize: "0.9375rem" }}
            >
              {clinic.name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm" style={{ color: "#8a8fa0" }}>
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{clinic.streetAddress}, {clinic.city}</span>
            </div>
            {clinic.phone && (
              <div className="flex items-center gap-1 mt-0.5 text-sm" style={{ color: "#8a8fa0" }}>
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{clinic.phone}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <WaitTimeBadge estimate={clinic.waitEstimate} capacity={clinic.capacity} isClosed={clinic.isClosed} />
            {clinic.isOpenNow !== undefined && (
              <span
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: clinic.isOpenNow ? "#16a34a" : "#aaabac" }}
              >
                <Clock className="h-3 w-3" />
                {clinic.isOpenNow ? "Open now" : "Closed"}
              </span>
            )}
          </div>
        </div>

        {clinic.avgRating != null && (
          <div className="flex items-center gap-1 mt-2.5 text-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold" style={{ color: "#09205b" }}>{clinic.avgRating.toFixed(1)}</span>
            {clinic.reviewCount != null && (
              <span style={{ color: "#aaabac" }}>({clinic.reviewCount})</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
