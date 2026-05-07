import { UbieNav } from "@/components/UbieNav";
import { UbieFooter } from "@/components/UbieFooter";

export default function UrgentCareLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UbieNav />

      {children}

      <div className="border-t" style={{ borderColor: "rgba(9,32,91,0.08)", background: "#f4f5f7" }}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <p className="text-xs font-bold mb-2" style={{ color: "#5a6070" }}>
            Purpose and positioning of services
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#aaabac" }}>
            Ubie Urgent Care Finder is for informational purposes only. We strive to provide
            reliable and accurate information, but we do not guarantee the completeness of the
            content. If you find any errors in the information, please{" "}
            <a href="mailto:support@ubiehealth.com" className="underline hover:opacity-80">
              contact us
            </a>
            . The provision of information by physicians, medical professionals, etc. is not a
            medical treatment. If medical treatment is required, please consult your doctor or
            medical institution.
          </p>
        </div>
      </div>

      <UbieFooter />
    </>
  );
}
