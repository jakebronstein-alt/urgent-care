import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // In production the Replit proxy forwards /urgentcare/* to this container,
  // so all static asset URLs must carry the /urgentcare prefix.
  // Use undefined in dev so the dev server serves assets from / as normal.
  assetPrefix: process.env.NODE_ENV === "production" ? "/urgentcare" : undefined,
  allowedDevOrigins: ["*.replit.dev", "*.kirk.replit.dev"],
  async redirects() {
    return [
      // 301s from the old /urgent-care path — preserves SEO link equity
      {
        source: "/urgent-care",
        destination: "/urgentcare",
        permanent: true,
      },
      {
        source: "/urgent-care/:path*",
        destination: "/urgentcare/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
