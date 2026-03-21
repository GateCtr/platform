import type { MetadataRoute } from "next";
import { getSeoContext, type SeoContext } from "@/lib/seo";

const PRIVATE_PATHS = [
  "/dashboard",
  "/fr/dashboard",
  "/admin",
  "/fr/admin",
  "/api/",
  "/onboarding",
  "/fr/onboarding",
  "/sign-in",
  "/fr/sign-in",
  "/sign-up",
  "/fr/sign-up",
];

/**
 * Testable named export — accepts a SeoContext directly.
 * App subdomains disallow everything; marketing hosts expose sitemap.
 */
export function generateRobots(ctx: SeoContext): MetadataRoute.Robots {
  if (ctx.isAppSubdomain) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${ctx.marketingUrl}/sitemap.xml`,
  };
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const ctx = await getSeoContext();
  return generateRobots(ctx);
}
