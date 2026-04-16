import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["ioredis", "bullmq"],
  allowedDevOrigins: ["*.replit.dev", "*.riker.replit.dev"],
};

export default withNextIntl(nextConfig);
