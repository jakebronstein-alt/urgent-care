import { WaitTimeEstimate, levelColors, sourceLabel, capacityLabel, ClinicCapacity } from "@/lib/wait-time";
import { Users, Info, MoonStar } from "lucide-react";

interface Props {
  estimate: WaitTimeEstimate;
  capacity?: ClinicCapacity;
  size?: "sm" | "hero";
  isClosed?: boolean;
  nextOpenLabel?: string | null;
  yesterdayAvgMinutes?: number | null;
}

export function WaitTimeBadge({ estimate, capacity = "MEDIUM", size = "sm", isClosed = false, nextOpenLabel, yesterdayAvgMinutes }: Props) {
  const colors = levelColors(estimate.level);

  if (size === "hero" && isClosed) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="flex items-center gap-3 mb-3">
          <MoonStar className="h-5 w-5 text-gray-400 shrink-0" />
          <span className="text-2xl font-black tracking-wide text-gray-500">CURRENTLY CLOSED</span>
        </div>
        {nextOpenLabel && (
          <p className="text-sm font-medium text-gray-600 mb-2">{nextOpenLabel}</p>
        )}
        {yesterdayAvgMinutes != null && yesterdayAvgMinutes > 0 && (
          <div className="flex items-start gap-1.5 text-xs text-gray-400 mt-3">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Yesterday&apos;s average wait: ~{yesterdayAvgMinutes} min</span>
          </div>
        )}
      </div>
    );
  }

  if (size === "hero") {
    return (
      <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-5`}>
        {/* Main wait level */}
        <div className="flex items-center gap-3 mb-3">
          <span className={`h-3 w-3 rounded-full ${colors.hero} shrink-0`} />
          <span className={`text-2xl font-black tracking-wide ${colors.text}`}>
            {estimate.label}
          </span>
        </div>

        {/* Estimated tag */}
        {estimate.isEstimated && estimate.level !== "unknown" && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide text-gray-400 border border-gray-200 rounded-full px-2 py-0.5 mb-2 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-pulse" />
            ESTIMATED
          </span>
        )}

        {/* People count + estimated minutes */}
        {estimate.level !== "unknown" && (
          <div className="flex items-center gap-2 mb-3">
            <Users className={`h-4 w-4 ${colors.text} opacity-70`} />
            <span className={`text-sm font-medium ${colors.text}`}>
              {estimate.adjustedCount === 0
                ? "Little to no wait right now"
                : `~${estimate.adjustedCount} ${estimate.adjustedCount === 1 ? "person" : "people"} in waiting room`}
              {estimate.estimatedMinutes > 0 && (
                <span className="opacity-75"> · ~{estimate.estimatedMinutes} min</span>
              )}
            </span>
          </div>
        )}

        {/* Source / clinic size */}
        <div className="flex items-start gap-1.5 text-xs text-gray-400">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            {capacityLabel(capacity)} ·{" "}
            {sourceLabel(estimate.source, estimate.lastUpdatedAt)}
            {estimate.isEstimated && (
              <span className="ml-1 italic">— submit an update if you&apos;re here</span>
            )}
          </span>
        </div>
      </div>
    );
  }

  // Small badge (used in clinic cards)
  if (isClosed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
        <MoonStar className="h-3 w-3" />
        Closed
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot} ${estimate.isEstimated ? "animate-pulse" : ""}`} />
      {estimate.level === "unknown" ? "No data" : estimate.isEstimated ? `~${estimate.label}` : estimate.label}
    </span>
  );
}
