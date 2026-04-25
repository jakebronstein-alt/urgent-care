export interface UbieLink {
  label: string;
  url: string;
  type: "symptom" | "disease";
}

export interface ServiceInfo {
  name: string;
  slug: string;
  definition: string;
  reasons: string[];
  /** Most relevant Ubie symptom / disease pages for this service */
  ubieLinks: UbieLink[];
}

const SERVICES: ServiceInfo[] = [
  {
    name: "X-Ray",
    slug: "x-ray",
    definition:
      "An X-ray is a quick, painless imaging test that uses low doses of radiation to create pictures of the inside of your body. It is most commonly used to assess bones, lungs, and soft tissue.",
    reasons: [
      "You've had a fall or impact and suspect a fracture or broken bone",
      "You have chest pain or a persistent cough and want to rule out pneumonia",
      "A foreign object may have been swallowed or lodged in the body",
      "Your doctor needs a baseline image before or after a procedure",
    ],
    ubieLinks: [
      { label: "Check chest pain symptoms", url: "https://ubiehealth.com/symptoms/chest-pain", type: "symptom" },
      { label: "Could it be pneumonia?", url: "https://ubiehealth.com/diseases/pneumonia", type: "disease" },
    ],
  },
  {
    name: "COVID Testing",
    slug: "covid-testing",
    definition:
      "COVID-19 testing detects an active infection using rapid antigen or PCR tests. Results help determine whether symptoms are caused by COVID-19, guide treatment decisions, and satisfy travel, work, or school requirements.",
    reasons: [
      "You have symptoms such as fever, cough, sore throat, or loss of smell or taste",
      "You've been in close contact with someone who tested positive",
      "You need documentation for travel, return to work, or school",
      "You want peace of mind before visiting someone who is immunocompromised",
    ],
    ubieLinks: [
      { label: "Check your COVID-19 symptoms", url: "https://ubiehealth.com/diseases/covid-19", type: "disease" },
      { label: "Could it be the flu instead?", url: "https://ubiehealth.com/diseases/influenza", type: "disease" },
    ],
  },
  {
    name: "STI Testing",
    slug: "sti-testing",
    definition:
      "STI testing screens for sexually transmitted infections including chlamydia, gonorrhea, syphilis, herpes, and HIV. Most STIs have no symptoms, making routine screening an important part of sexual health.",
    reasons: [
      "You've had unprotected sex or a new partner",
      "You have symptoms such as discharge, sores, burning, or unusual odor",
      "It's been more than a year since your last screening",
      "You or a partner have tested positive and want to confirm results",
    ],
    ubieLinks: [
      { label: "Check chlamydia symptoms", url: "https://ubiehealth.com/diseases/chlamydia", type: "disease" },
      { label: "Check gonorrhea symptoms", url: "https://ubiehealth.com/diseases/gonorrhea", type: "disease" },
    ],
  },
  {
    name: "Laceration Repair",
    slug: "laceration-repair",
    definition:
      "Laceration repair is the treatment of cuts and wounds that are too deep, wide, or complex to heal safely on their own. It may involve cleaning the wound, removing debris, and closing it with sutures, staples, or skin glue.",
    reasons: [
      "A cut is deeper than a quarter inch or has edges that won't stay together",
      "The wound is on the face, hand, or a joint where scarring or mobility matter",
      "Bleeding has not slowed after 10–15 minutes of direct pressure",
      "The wound is from a bite, rusty object, or contaminated source",
    ],
    ubieLinks: [
      { label: "Check bleeding symptoms", url: "https://ubiehealth.com/symptoms/bleeding", type: "symptom" },
      { label: "Signs of wound infection", url: "https://ubiehealth.com/diseases/cellulitis", type: "disease" },
    ],
  },
  {
    name: "Occupational Health",
    slug: "occupational-health",
    definition:
      "Occupational health services focus on work-related injuries and illnesses, including workers' compensation evaluations, pre-employment physicals, drug screenings, and management of injuries that happen on the job.",
    reasons: [
      "You've been injured at work and need a workers' compensation evaluation",
      "Your employer requires a pre-employment physical or drug screening",
      "You need a fitness-for-duty exam to return to work after an illness or injury",
      "You've been exposed to a hazardous substance or situation at work",
    ],
    ubieLinks: [
      { label: "Check back pain symptoms", url: "https://ubiehealth.com/symptoms/back-pain", type: "symptom" },
      { label: "Check joint pain symptoms", url: "https://ubiehealth.com/symptoms/joint-pain", type: "symptom" },
    ],
  },
  {
    name: "Sports Medicine",
    slug: "sports-medicine",
    definition:
      "Sports medicine at urgent care focuses on the diagnosis and treatment of musculoskeletal injuries related to physical activity — including sprains, strains, stress fractures, and joint injuries — along with guidance on safe return to activity.",
    reasons: [
      "You've sprained an ankle, knee, or wrist during exercise or a game",
      "You have joint swelling, instability, or pain that worsened with activity",
      "You suspect a stress fracture from repetitive high-impact exercise",
      "You need a medical clearance or return-to-play evaluation",
    ],
    ubieLinks: [
      { label: "Check joint pain symptoms", url: "https://ubiehealth.com/symptoms/joint-pain", type: "symptom" },
      { label: "Could it be a sprain?", url: "https://ubiehealth.com/diseases/sprain", type: "disease" },
    ],
  },
  {
    name: "Physicals",
    slug: "physicals",
    definition:
      "A physical examination is a comprehensive health check-up that assesses your overall wellness. Urgent care clinics commonly offer school physicals, sports (pre-participation) physicals, and employment physicals.",
    reasons: [
      "Your school or sports team requires a physical before the season starts",
      "A new employer requires a pre-hire physical or health clearance",
      "You need an annual wellness check and can't get a timely appointment with your PCP",
      "Immigration or licensing paperwork requires a documented physical exam",
    ],
    ubieLinks: [
      { label: "Explore all symptoms", url: "https://ubiehealth.com/symptoms", type: "symptom" },
      { label: "Explore all diseases & conditions", url: "https://ubiehealth.com/diseases", type: "disease" },
    ],
  },
  {
    name: "Travel Medicine",
    slug: "travel-medicine",
    definition:
      "Travel medicine consultations help you prepare for international travel by assessing destination-specific health risks, recommending and administering vaccines, and prescribing preventive medications such as antimalarials.",
    reasons: [
      "You're traveling to a region where certain vaccines or prophylactics are recommended",
      "You need documentation of vaccinations (e.g. yellow fever) for entry into a country",
      "You want guidance on food and water safety, altitude sickness, or traveler's diarrhea",
      "You've returned from travel with symptoms that may be related to your destination",
    ],
    ubieLinks: [
      { label: "Check malaria symptoms", url: "https://ubiehealth.com/diseases/malaria", type: "disease" },
      { label: "Check traveler's diarrhea symptoms", url: "https://ubiehealth.com/diseases/travelers-diarrhea", type: "disease" },
    ],
  },
  {
    name: "Lab Tests",
    slug: "lab-tests",
    definition:
      "On-site lab testing allows clinicians to collect and analyze blood, urine, and swab samples for a wide range of diagnostic purposes — from rapid strep and flu tests to comprehensive blood panels — often with results available within the visit.",
    reasons: [
      "You have a sore throat and need a rapid strep or mono test",
      "Your doctor needs bloodwork such as a CBC, metabolic panel, or thyroid function test",
      "You need a urinalysis to check for a urinary tract infection or kidney issue",
      "You require rapid flu or RSV testing before starting antiviral treatment",
    ],
    ubieLinks: [
      { label: "Check sore throat symptoms", url: "https://ubiehealth.com/symptoms/sore-throat", type: "symptom" },
      { label: "Could it be strep throat?", url: "https://ubiehealth.com/diseases/strep-throat", type: "disease" },
    ],
  },
  {
    name: "Pediatrics",
    slug: "pediatrics",
    definition:
      "Pediatric urgent care provides medical attention specifically tailored to infants, children, and teenagers. Clinicians experienced in pediatric care handle the unique physiological and communication needs of young patients.",
    reasons: [
      "Your child has a high fever, earache, or sore throat that needs same-day attention",
      "Your child has sustained a minor injury such as a cut, sprain, or suspected fracture",
      "Your child has a rash, respiratory illness, or vomiting that is getting worse",
      "Your pediatrician doesn't have same-day availability and your child can't wait",
    ],
    ubieLinks: [
      { label: "Check fever symptoms", url: "https://ubiehealth.com/symptoms/fever", type: "symptom" },
      { label: "Could it be an ear infection?", url: "https://ubiehealth.com/diseases/ear-infection", type: "disease" },
    ],
  },
  {
    name: "Multilingual Staff",
    slug: "multilingual-staff",
    definition:
      "Clinics with multilingual staff have clinicians or support personnel who speak languages in addition to English, allowing patients to communicate their symptoms, history, and concerns clearly in their preferred language.",
    reasons: [
      "English is not your primary language and you want to describe symptoms accurately",
      "You're accompanying a family member who is more comfortable in another language",
      "You want to ensure informed consent and discharge instructions are fully understood",
    ],
    ubieLinks: [
      { label: "Explore all symptoms", url: "https://ubiehealth.com/symptoms", type: "symptom" },
      { label: "Explore all diseases & conditions", url: "https://ubiehealth.com/diseases", type: "disease" },
    ],
  },
];

// Lookup by slug
const BY_SLUG: Record<string, ServiceInfo> = Object.fromEntries(
  SERVICES.map((s) => [s.slug, s])
);

// Lookup by canonical name
const BY_NAME: Record<string, ServiceInfo> = Object.fromEntries(
  SERVICES.map((s) => [s.name, s])
);

export function getServiceBySlug(slug: string): ServiceInfo | null {
  return BY_SLUG[slug] ?? null;
}

export function getServiceByName(name: string): ServiceInfo | null {
  return BY_NAME[name] ?? null;
}

export function serviceToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export { SERVICES };
