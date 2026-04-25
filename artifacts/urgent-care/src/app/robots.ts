import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/urgent-care",
        disallow: ["/admin", "/dashboard", "/api"],
      },
    ],
    sitemap: "https://ubiehealth.com/sitemap.xml",
  };
}
