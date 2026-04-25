/**
 * Seed script: upserts all clinics from scripts/data/clinics.json into the database.
 *
 * Run with:
 *   npx tsx scripts/seed-clinics.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";

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

async function main() {
  const dataPath = path.join(process.cwd(), "scripts", "data", "clinics.json");
  const clinics = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  console.log(`Seeding ${clinics.length} clinics...\n`);

  let inserted = 0, updated = 0;

  for (let i = 0; i < clinics.length; i++) {
    const c = clinics[i];
    const result = await prisma.clinic.upsert({
      where: {
        stateSlug_citySlug_addressSlug_clinicSlug: {
          stateSlug: c.stateSlug,
          citySlug: c.citySlug,
          addressSlug: c.addressSlug,
          clinicSlug: c.clinicSlug,
        },
      },
      update: {
        name: c.name,
        streetAddress: c.streetAddress,
        city: c.city,
        state: c.state,
        zip: c.zip,
        lat: c.lat,
        lng: c.lng,
        phone: c.phone,
        website: c.website,
        zocdocUrl: c.zocdocUrl,
        hours: c.hours,
        services: c.services,
        capacity: c.capacity,
        googlePlaceId: c.googlePlaceId,
      },
      create: {
        name: c.name,
        streetAddress: c.streetAddress,
        city: c.city,
        state: c.state,
        zip: c.zip,
        lat: c.lat,
        lng: c.lng,
        stateSlug: c.stateSlug,
        citySlug: c.citySlug,
        addressSlug: c.addressSlug,
        clinicSlug: c.clinicSlug,
        phone: c.phone,
        website: c.website,
        zocdocUrl: c.zocdocUrl,
        hours: c.hours,
        services: c.services,
        capacity: c.capacity,
        googlePlaceId: c.googlePlaceId,
      },
    });

    const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
    isNew ? inserted++ : updated++;
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${clinics.length}...`);
  }

  console.log(`\nDone. ${inserted} inserted, ${updated} updated.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
