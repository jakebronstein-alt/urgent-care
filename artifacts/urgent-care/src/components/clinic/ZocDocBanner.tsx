interface ZocDocBannerProps {
  zocdocUrl: string;
}

export function ZocDocBanner({ zocdocUrl }: ZocDocBannerProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sponsored</p>
        <p className="text-base font-bold text-ubie-dark leading-snug">
          Book in advance and skip the wait{" "}
          <span className="text-gray-400 font-normal">(more or less)</span>
        </p>
        <p className="text-sm text-gray-500 mt-0.5">
          Reserve your spot online — no more guessing.
        </p>
      </div>
      <a
        href={zocdocUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="shrink-0 rounded-[30px] bg-ubie-blue text-white text-sm font-semibold px-5 py-2.5 hover:bg-ubie-blue/90 transition-colors text-center"
      >
        Book your appointment now
      </a>
    </div>
  );
}
