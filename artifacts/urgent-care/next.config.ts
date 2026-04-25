import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.replit.dev", "*.kirk.replit.dev"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
