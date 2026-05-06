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
      { text: "Editorial Policy", href: "https://ubiehealth.com/medical-content-editorial-policy" },
      { text: "Clinical Data Sources", href: "https://ubiehealth.com/clinical-data-sources" },
      { text: "Supervising Doctors", href: "https://ubiehealth.com/doctors" },
    ],
  },
  {
    heading: "Corporate",
    links: [
      { text: "About Us", href: "https://ubiehealth.com/company/about" },
      { text: "Careers", href: "https://recruit.ubiehealth.com" },
      { text: "Privacy Policy", href: "https://ubiehealth.com/privacy-policy" },
      { text: "Terms of Use", href: "https://ubiehealth.com/terms" },
      { text: "Contact Us", href: "https://ubiehealth.com/contact-us" },
    ],
  },
];

function UbieMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M16 28C16 28 4 21.6 4 12.8C4 8.97 7.13 6 11 6C13.09 6 14.96 6.93 16 8.4C17.04 6.93 18.91 6 21 6C24.87 6 28 8.97 28 12.8C28 21.6 16 28 16 28Z"
        fill="#f777a6"
      />
    </svg>
  );
}

export function UbieFooter() {
  return (
    <footer style={{ borderTop: "1px solid rgba(9,32,91,0.10)", background: "#fff" }}>
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Logo row */}
        <div className="flex items-center gap-2 mb-10">
          <UbieMark />
          <span className="font-black text-base tracking-tight" style={{ color: "#09205b" }}>Ubie</span>
          <span className="text-[11px] font-extrabold tracking-[0.12em] uppercase ml-1" style={{ color: "#aaabac" }}>Urgent Care</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.heading}>
              <p
                className="text-xs font-extrabold uppercase tracking-[0.1em] mb-3"
                style={{ color: "#3d4454" }}
              >
                {section.heading}
              </p>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs transition-colors hover:opacity-80"
                      style={{ color: "#8a8fa0" }}
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          style={{ borderTop: "1px solid rgba(9,32,91,0.08)" }}
        >
          <span className="text-xs" style={{ color: "#aaabac" }}>
            © {new Date().getFullYear()} Ubie, Inc. All rights reserved.
          </span>
          <div className="flex gap-5">
            <a href="https://ubiehealth.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-xs transition-colors hover:opacity-80" style={{ color: "#aaabac" }}>Privacy Policy</a>
            <a href="https://ubiehealth.com/terms" target="_blank" rel="noopener noreferrer" className="text-xs transition-colors hover:opacity-80" style={{ color: "#aaabac" }}>Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
