import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  // Do NOT add ioredis, bullmq, pg to serverExternalPackages.
  // Turbopack externalizes them into .next/node_modules/ with hashed names
  // but fails to include transitive deps (tslib, pg-types, @ioredis/commands).
  // Letting Turbopack bundle them resolves all missing module errors on Lambda.
  serverExternalPackages: [],
  allowedDevOrigins: ["*.replit.dev", "*.riker.replit.dev"],
  // Disable source maps in production to reduce build artifact size
  productionBrowserSourceMaps: false,
};

export default withNextIntl(nextConfig);
