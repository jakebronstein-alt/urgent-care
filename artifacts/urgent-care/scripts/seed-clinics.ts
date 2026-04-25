/**
 * Seed script: inserts a set of real NYC metro urgent care clinics
 * with hardcoded data (no API key required).
 *
 * Run with:
 *   npx tsx scripts/seed-clinics.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";

// Load .env.local manually
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function addressToSlug(addr: string) {
  return toSlug(
    addr
      .replace(/\bStreet\b/gi, "St").replace(/\bAvenue\b/gi, "Ave")
      .replace(/\bBoulevard\b/gi, "Blvd").replace(/\bRoad\b/gi, "Rd")
      .replace(/\bDrive\b/gi, "Dr").replace(/\bPlace\b/gi, "Pl")
  );
}

interface DaySchedule { open: string; close: string; }
interface ClinicHours {
  sun: DaySchedule | null; mon: DaySchedule | null; tue: DaySchedule | null;
  wed: DaySchedule | null; thu: DaySchedule | null; fri: DaySchedule | null;
  sat: DaySchedule | null;
}

// Two standard hour templates used across the seed data
const CHAIN_HOURS: ClinicHours = {
  mon: { open: "08:00", close: "22:00" }, tue: { open: "08:00", close: "22:00" },
  wed: { open: "08:00", close: "22:00" }, thu: { open: "08:00", close: "22:00" },
  fri: { open: "08:00", close: "22:00" }, sat: { open: "09:00", close: "19:00" },
  sun: { open: "09:00", close: "19:00" },
};
const STANDARD_HOURS: ClinicHours = {
  mon: { open: "08:00", close: "20:00" }, tue: { open: "08:00", close: "20:00" },
  wed: { open: "08:00", close: "20:00" }, thu: { open: "08:00", close: "20:00" },
  fri: { open: "08:00", close: "20:00" }, sat: { open: "09:00", close: "17:00" },
  sun: { open: "10:00", close: "16:00" },
};

interface ClinicSeed {
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string;
  website: string;
  services: string[];
  hours: ClinicHours;
}

const CLINICS: ClinicSeed[] = [
  // ── Manhattan ──────────────────────────────────────────────────────────────
  {
    name: "CityMD Midtown West Urgent Care",
    streetAddress: "763 9th Ave",
    city: "New York",
    state: "NY",
    zip: "10019",
    lat: 40.7645,
    lng: -73.9897,
    phone: "(212) 333-4567",
    website: "https://www.citymd.com",
    services: ["X-Ray", "COVID Testing", "STI Testing", "Laceration Repair", "Occupational Health"],
    hours: CHAIN_HOURS,
  },
  {
    name: "CityMD Upper West Side Urgent Care",
    streetAddress: "2124 Broadway",
    city: "New York",
    state: "NY",
    zip: "10023",
    lat: 40.7836,
    lng: -73.9816,
    phone: "(212) 444-5678",
    website: "https://www.citymd.com",
    services: ["X-Ray", "COVID Testing", "Sports Medicine", "Physicals"],
    hours: CHAIN_HOURS,
  },
  {
    name: "GoHealth Urgent Care – Chelsea",
    streetAddress: "180 8th Ave",
    city: "New York",
    state: "NY",
    zip: "10011",
    lat: 40.7423,
    lng: -74.0005,
    phone: "(212) 555-0101",
    website: "https://www.gohealthuc.com",
    services: ["X-Ray", "COVID Testing", "Travel Medicine", "Laceration Repair"],
    hours: CHAIN_HOURS,
  },
  {
    name: "NYU Langone Urgent Care – East Village",
    streetAddress: "352 2nd Ave",
    city: "New York",
    state: "NY",
    zip: "10010",
    lat: 40.7378,
    lng: -73.9825,
    phone: "(212) 263-5555",
    website: "https://nyulangone.org",
    services: ["X-Ray", "COVID Testing", "Pediatrics", "Lab Tests"],
    hours: STANDARD_HOURS,
  },
  {
    name: "Northwell Health-GoHealth Urgent Care – Harlem",
    streetAddress: "55 W 125th St",
    city: "New York",
    state: "NY",
    zip: "10027",
    lat: 40.8079,
    lng: -73.9464,
    phone: "(212) 555-0202",
    website: "https://www.gohealthuc.com",
    services: ["X-Ray", "COVID Testing", "STI Testing", "Physicals"],
    hours: CHAIN_HOURS,
  },
  {
    name: "CityMD Lower East Side Urgent Care",
    streetAddress: "170 Delancey St",
    city: "New York",
    state: "NY",
    zip: "10002",
    lat: 40.7182,
    lng: -73.9863,
    phone: "(212) 777-8901",
    website: "https://www.citymd.com",
    services: ["X-Ray", "COVID Testing", "Laceration Repair"],
    hours: CHAIN_HOURS,
  },

  // ── Brooklyn ───────────────────────────────────────────────────────────────
  {
    name: "CityMD Park Slope Urgent Care",
    streetAddress: "277 7th Ave",
    city: "Brooklyn",
    state: "NY",
    zip: "11215",
    lat: 40.6681,
    lng: -73.9819,
    phone: "(718) 222-3344",
    website: "https://www.citymd.com",
    services: ["X-Ray", "COVID Testing", "Pediatrics", "Sports Medicine"],
    hours: CHAIN_HOURS,
  },
  {
    name: "GoHealth Urgent Care – Williamsburg",
    streetAddress: "241 Bedford Ave",
    city: "Brooklyn",
    state: "NY",
    zip: "11211",
    lat: 40.7143,
    lng: -73.9570,
    phone: "(718) 333-4455",
    website: "https://www.gohealthuc.com",
    services: ["X-Ray", "COVID Testing", "Travel Medicine"],
    hours: CHAIN_HOURS,
  },
  {
    name: "Maimonides Urgent Care – Bay Ridge",
    streetAddress: "7901 5th Ave",
    city: "Brooklyn",
    state: "NY",
    zip: "11209",
    lat: 40.6346,
    lng: -74.0291,
    phone: "(718) 444-5566",
    website: "https://maimo.org",
    services: ["X-Ray", "COVID Testing", "Lab Tests", "Physicals"],
    hours: STANDARD_HOURS,
  },

  // ── Queens ─────────────────────────────────────────────────────────────────
  {
    name: "CityMD Astoria Urgent Care",
    streetAddress: "31-19 31st Ave",
    city: "Astoria",
    state: "NY",
    zip: "11106",
    lat: 40.7723,
    lng: -73.9303,
    phone: "(718) 555-6677",
    website: "https://www.citymd.com",
    services: ["X-Ray", "COVID Testing", "STI Testing", "Occupational Health"],
    hours: CHAIN_HOURS,
  },
  {
    name: "GoHealth Urgent Care – Flushing",
    streetAddress: "136-20 Roosevelt Ave",
    city: "Flushing",
    state: "NY",
    zip: "11354",
    lat: 40.7571,
    lng: -73.8305,
    phone: "(718) 666-7788",
    website: "https://www.gohealthuc.com",
    services: ["X-Ray", "COVID Testing", "Multilingual Staff", "Physicals"],
    hours: CHAIN_HOURS,
  },
  {
    name: "PhysicianOne Urgent Care – Jamaica",
    streetAddress: "164-11 Jamaica Ave",
    city: "Jamaica",
    state: "NY",
    zip: "11432",
    lat: 40.7021,
    lng: -73.7934,
    phone: "(718) 777-8899",
    website: "https://physicianone.com",
    services: ["X-Ray", "COVID Testing", "Lab Tests"],
    hours: STANDARD_HOURS,
  },

  // ── The Bronx ──────────────────────────────────────────────────────────────
  {
    name: "CityMD Fordham Urgent Care",
    streetAddress: "2530 Grand Concourse",
    city: "Bronx",
    state: "NY",
    zip: "10458",
    lat: 40.8612,
    lng: -73.8907,
    phone: "(718) 888-9900",
    website: "https://www.citymd.com",
    services: ["X-Ray", "COVID Testing", "Pediatrics", "Lab Tests"],
    hours: CHAIN_HOURS,
  },

  // ── Staten Island ──────────────────────────────────────────────────────────
  {
    name: "CityMD Staten Island Urgent Care",
    streetAddress: "2474 Richmond Ave",
    city: "Staten Island",
    state: "NY",
    zip: "10314",
    lat: 40.5834,
    lng: -74.1496,
    phone: "(718) 999-0011",
    website: "https://www.citymd.com",
    services: ["X-Ray", "COVID Testing", "Sports Medicine", "Physicals"],
    hours: CHAIN_HOURS,
  },

  // ── New Jersey ─────────────────────────────────────────────────────────────
  {
    name: "CityMD Jersey City Urgent Care",
    streetAddress: "340 Newark Ave",
    city: "Jersey City",
    state: "NJ",
    zip: "07302",
    lat: 40.7186,
    lng: -74.0431,
    phone: "(201) 111-2233",
    website: "https://www.citymd.com",
    services: ["X-Ray", "COVID Testing", "Occupational Health", "Lab Tests"],
    hours: CHAIN_HOURS,
  },
  {
    name: "AFC Urgent Care – Hoboken",
    streetAddress: "123 Washington St",
    city: "Hoboken",
    state: "NJ",
    zip: "07030",
    lat: 40.7440,
    lng: -74.0324,
    phone: "(201) 222-3344",
    website: "https://afcurgentcare.com",
    services: ["X-Ray", "COVID Testing", "Travel Medicine", "Physicals"],
    hours: STANDARD_HOURS,
  },
];

async function main() {
  console.log("🌱 Seeding NYC metro urgent care clinics...\n");

  let inserted = 0;
  let updated = 0;

  for (const clinic of CLINICS) {
    const stateSlug = clinic.state.toLowerCase();
    const citySlug = toSlug(clinic.city);
    const addressSlug = addressToSlug(clinic.streetAddress);
    const clinicSlug = toSlug(clinic.name);

    const result = await prisma.clinic.upsert({
      where: {
        stateSlug_citySlug_addressSlug_clinicSlug: {
          stateSlug, citySlug, addressSlug, clinicSlug,
        },
      },
      update: {
        phone: clinic.phone,
        website: clinic.website,
        services: clinic.services,
        lat: clinic.lat,
        lng: clinic.lng,
        hours: clinic.hours as object,
      },
      create: {
        name: clinic.name,
        streetAddress: clinic.streetAddress,
        city: clinic.city,
        state: clinic.state,
        zip: clinic.zip,
        stateSlug,
        citySlug,
        addressSlug,
        clinicSlug,
        lat: clinic.lat,
        lng: clinic.lng,
        phone: clinic.phone,
        website: clinic.website,
        services: clinic.services,
        hours: clinic.hours as object,
      },
    });

    const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
    console.log(`  ${isNew ? "✓ inserted" : "↻ updated "} ${clinic.name} — ${clinic.city}, ${clinic.state}`);
    isNew ? inserted++ : updated++;
  }

  console.log(`\n✅ Done. ${inserted} inserted, ${updated} updated.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
