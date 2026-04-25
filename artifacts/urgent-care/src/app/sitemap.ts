import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SERVICES } from "@/lib/services-info";

const BASE_URL = "https://ubiehealth.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/urgent-care`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/urgent-care/search`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  let cities: { stateSlug: string; citySlug: string }[] = [];
  let clinics: {
    stateSlug: string;
    citySlug: string;
    addressSlug: string;
    clinicSlug: string;
    updatedAt: Date;
  }[] = [];

  try {
    [cities, clinics] = await Promise.all([
      prisma.clinic.findMany({
        select: { stateSlug: true, citySlug: true },
        distinct: ["stateSlug", "citySlug"],
      }),
      prisma.clinic.findMany({
        select: {
          stateSlug: true,
          citySlug: true,
          addressSlug: true,
          clinicSlug: true,
          updatedAt: true,
        },
      }),
    ]);
  } catch {
    return staticPages;
  }

  const cityPages: MetadataRoute.Sitemap = cities.map(({ stateSlug, citySlug }) => ({
    url: `${BASE_URL}/urgent-care/${stateSlug}/${citySlug}`,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const servicePages: MetadataRoute.Sitemap = cities.flatMap(({ stateSlug, citySlug }) =>
    SERVICES.map(({ slug }) => ({
      url: `${BASE_URL}/urgent-care/${stateSlug}/${citySlug}/services/${slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }))
  );

  const clinicPages: MetadataRoute.Sitemap = clinics.map(
    ({ stateSlug, citySlug, addressSlug, clinicSlug, updatedAt }) => ({
      url: `${BASE_URL}/urgent-care/${stateSlug}/${citySlug}/${addressSlug}/${clinicSlug}`,
      lastModified: updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  return [...staticPages, ...cityPages, ...servicePages, ...clinicPages];
}
