const FOOTER_SECTIONS = [
  {
    heading: "Our Services",
    links: [
      { text: "Symptom Checker", href: "https://ubiehealth.com/symptom-checker" },
      { text: "Doctor's Note", href: "https://ubiehealth.com/doctors-note" },
      { text: "Checkup", href: "https://ubiehealth.com/checkup/asthma" },
      { text: "Smart Support", href: "https://ubiehealth.com/smart-support" },
    ],
  },
  {
    heading: "Medical Information",
    links: [
      { text: "Symptoms", href: "https://ubiehealth.com/symptoms" },
      { text: "Diseases", href: "https://ubiehealth.com/diseases" },
      { text: "Care Options", href: "https://ubiehealth.com/care-options" },
    ],
  },
  {
    heading: "Helpful Resources",
    links: [
      { text: "How Ubie's Medical AI Works", href: "https://ubiehealth.com/how-ubies-ai-works" },
      { text: "Medical Content Editorial Policy", href: "https://ubiehealth.com/medical-content-editorial-policy" },
      { text: "Clinical Data Sources", href: "https://ubiehealth.com/clinical-data-sources" },
      { text: "Supervising Doctors", href: "https://ubiehealth.com/doctors" },
      { text: "Partners", href: "https://ubiehealth.com/pcv-partners" },
    ],
  },
  {
    heading: "Corporate",
    links: [
      { text: "About Us", href: "https://ubiehealth.com/company/about" },
      { text: "Careers", href: "https://recruit.ubiehealth.com" },
      { text: "Terms of Use", href: "https://ubiehealth.com/terms" },
      { text: "Security Policy", href: "https://ubiehealth.com/company/information-security-policy/1uo_0Ryh" },
      { text: "Privacy Policy", href: "https://ubiehealth.com/privacy-policy" },
      { text: "Contact Us", href: "https://ubiehealth.com/contact-us" },
      { text: "Company Website", href: "https://ubiehealth.com/company" },
    ],
  },
];

export function UbieFooter() {
  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.heading}>
              <p className="text-xs font-bold text-ubie-dark uppercase tracking-wide mb-3">
                {section.heading}
              </p>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-ubie-blue transition-colors"
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-xs text-gray-400">
            © {new Date().getFullYear()} Ubie, Inc. All rights reserved.
          </span>
          <div className="flex gap-4">
            <a href="https://ubiehealth.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-ubie-blue transition-colors">Privacy Policy</a>
            <a href="https://ubiehealth.com/terms" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-ubie-blue transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </div>
  );
}
