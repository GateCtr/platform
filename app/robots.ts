import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://gatectr.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
