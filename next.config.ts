import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "ioredis",
    "bullmq",
    "pg",
    "pg-types",
    "pg-pool",
    "@prisma/adapter-pg",
  ],
  allowedDevOrigins: ["*.replit.dev", "*.riker.replit.dev"],
  // Disable source maps in production to reduce build artifact size
  // Source maps are available via Sentry upload during CI instead
  productionBrowserSourceMaps: false,
};

export default withNextIntl(nextConfig);
