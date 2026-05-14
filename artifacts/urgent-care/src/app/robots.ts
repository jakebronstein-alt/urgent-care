import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/urgentcare/",
        disallow: [
          "/urgentcare/admin",
          "/urgentcare/jakehimself",
          "/urgentcare/api/",
          "/urgentcare/auth/",
        ],
      },
    ],
    sitemap: "https://ubiehealth.com/urgentcare/sitemap.xml",
  };
}
