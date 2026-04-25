import { UbieFooter } from "@/components/UbieFooter";

export default function UrgentCareLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}

      {/* Disclaimer */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            Purpose and positioning of services
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Ubie Urgent Care Finder is for informational purposes only. We strive to provide
            reliable and accurate information, but we do not guarantee the completeness of the
            content. If you find any errors in the information, please{" "}
            <a href="mailto:support@ubiehealth.com" className="underline hover:text-gray-600">
              contact us
            </a>
            . The provision of information by physicians, medical professionals, etc. is not a
            medical treatment. If medical treatment is required, please consult your doctor or
            medical institution.
          </p>
        </div>
      </div>

      {/* Ubie site-wide footer */}
      <UbieFooter />
    </>
  );
}
