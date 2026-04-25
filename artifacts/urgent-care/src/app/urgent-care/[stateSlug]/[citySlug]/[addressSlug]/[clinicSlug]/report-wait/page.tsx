import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ReportWaitForm } from "./ReportWaitForm";

interface Props {
  params: Promise<{
    stateSlug: string;
    citySlug: string;
    addressSlug: string;
    clinicSlug: string;
  }>;
}

export default async function ReportWaitPage({ params }: Props) {
  const { stateSlug, citySlug, addressSlug, clinicSlug } = await params;

  const clinic = await prisma.clinic.findUnique({
    where: {
      stateSlug_citySlug_addressSlug_clinicSlug: {
        stateSlug, citySlug, addressSlug, clinicSlug,
      },
    },
    select: { id: true, name: true, streetAddress: true, city: true, state: true },
  });

  if (!clinic) notFound();

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-12">
        <a
          href={`/urgent-care/${stateSlug}/${citySlug}/${addressSlug}/${clinicSlug}`}
          className="text-sm text-ubie-blue hover:underline mb-6 inline-block"
        >
          ← Back to {clinic.name}
        </a>

        <h1 className="text-2xl font-bold text-ubie-dark">Update Wait Time</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {clinic.streetAddress}, {clinic.city}, {clinic.state}
        </p>

        <div className="mt-8 rounded-2xl border border-gray-200 p-6">
          <p className="text-ubie-dark font-medium mb-1">
            How many people are currently in the waiting room?
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Count only people waiting to be seen, not those already with a provider.
          </p>
          <ReportWaitForm clinicId={clinic.id} clinicName={clinic.name} />
        </div>
      </div>
    </main>
  );
}
