import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Shield } from "lucide-react";
import { prisma } from "@/lib/db";
import { ClaimForm } from "./ClaimForm";

interface Props {
  params: Promise<{
    stateSlug: string;
    citySlug: string;
    addressSlug: string;
    clinicSlug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug, citySlug, addressSlug, clinicSlug } = await params;
  const clinic = await prisma.clinic.findUnique({
    where: { stateSlug_citySlug_addressSlug_clinicSlug: { stateSlug, citySlug, addressSlug, clinicSlug } },
    select: { name: true },
  });
  if (!clinic) return {};
  return { title: `Claim ${clinic.name} | UbieHealth` };
}

export default async function ClaimPage({ params }: Props) {
  const { stateSlug, citySlug, addressSlug, clinicSlug } = await params;

  const clinic = await prisma.clinic.findUnique({
    where: { stateSlug_citySlug_addressSlug_clinicSlug: { stateSlug, citySlug, addressSlug, clinicSlug } },
    select: { id: true, name: true, city: true, state: true, isClaimed: true },
  });

  if (!clinic) notFound();

  const clinicDetailPath = `/urgent-care/${stateSlug}/${citySlug}/${addressSlug}/${clinicSlug}`;

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 flex-wrap">
            <Link href="/urgent-care" className="hover:text-ubie-blue">Urgent Care</Link>
            <ChevronRight className="h-3 w-3" />
            <a href={clinicDetailPath} className="hover:text-ubie-blue">{clinic.name}</a>
            <ChevronRight className="h-3 w-3" />
            <span className="text-ubie-dark font-medium">Claim this page</span>
          </nav>
          <h1 className="text-2xl font-bold text-ubie-dark">Claim {clinic.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{clinic.city}, {clinic.state}</p>
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {clinic.isClaimed ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <div className="text-3xl mb-3">🔒</div>
            <h2 className="text-lg font-bold text-ubie-dark mb-1">This page has already been claimed</h2>
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact us at{" "}
              <a href="mailto:hello@ubiehealth.com" className="text-ubie-blue hover:underline">
                hello@ubiehealth.com
              </a>.
            </p>
          </div>
        ) : (
          <>
            {/* What you get */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-ubie-blue" />
                <h2 className="font-semibold text-ubie-dark">What you get as a verified clinic</h2>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                {[
                  "Update your wait time in real time from a simple dashboard",
                  "Manage your services list and clinic hours",
                  "Respond to patient reviews",
                  "Verified badge on your listing",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-ubie-blue mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-semibold text-ubie-dark mb-4">Tell us about yourself</h2>
              <ClaimForm clinicId={clinic.id} clinicName={clinic.name} />
            </div>

            <p className="text-xs text-center text-gray-400">
              We typically review claims within 1–2 business days. We may ask for proof of affiliation (e.g. a business card or staff directory link).
            </p>
          </>
        )}
      </div>
    </main>
  );
}
