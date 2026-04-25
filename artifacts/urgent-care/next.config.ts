import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // In production the Replit proxy only forwards /urgent-care/* to this
  // container, so all static asset URLs must carry the /urgent-care prefix.
  // Use undefined in dev so the dev server serves assets from / as normal.
  assetPrefix: process.env.NODE_ENV === "production" ? "/urgent-care" : undefined,
  allowedDevOrigins: ["*.replit.dev", "*.kirk.replit.dev"],
};

export default nextConfig;
