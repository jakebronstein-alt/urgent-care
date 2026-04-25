import Link from "next/link";

interface Props {
  clinicName: string;
  claimPath: string;
  isClaimed: boolean;
}

export function ClaimBanner({ clinicName, claimPath, isClaimed }: Props) {
  if (isClaimed) return null;

  return (
    <div className="rounded-2xl border border-ubie-blue/20 bg-ubie-blue-light px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-ubie-dark">
          Affiliated with{" "}
          <span className="text-ubie-blue">{clinicName}</span>?
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Claim this page to ensure up-to-the-minute wait time information for your patients.
        </p>
      </div>
      <Link
        href={claimPath}
        className="shrink-0 rounded-[30px] bg-ubie-blue text-white text-xs font-bold px-5 py-2.5 hover:bg-ubie-blue/90 transition-colors text-center"
      >
        Claim this page →
      </Link>
    </div>
  );
}
