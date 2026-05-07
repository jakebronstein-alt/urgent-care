import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/urgentcare",
        disallow: ["/admin", "/dashboard", "/api"],
      },
    ],
    sitemap: "https://ubiehealth.com/urgentcare/sitemap.xml",
  };
}
