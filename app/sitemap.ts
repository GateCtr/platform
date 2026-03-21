import type { MetadataRoute } from "next";
import { getSeoContext } from "@/lib/seo";

const waitlistEnabled = process.env.ENABLE_WAITLIST === "true";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { isAppSubdomain, marketingUrl } = await getSeoContext();

  // App subdomain has no public pages to index
  if (isAppSubdomain) return [];

  const BASE_URL = marketingUrl;
  const now = new Date();

  const pages: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/features", changeFrequency: "monthly", priority: 0.9 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
    ...(waitlistEnabled
      ? [
          {
            path: "/waitlist",
            changeFrequency: "monthly" as const,
            priority: 0.8,
          },
        ]
      : []),
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const { path, changeFrequency, priority } of pages) {
    const enUrl = `${BASE_URL}${path}`;
    const frUrl = `${BASE_URL}/fr${path === "/" ? "" : path}`;

    entries.push({
      url: enUrl,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: { languages: { en: enUrl, fr: frUrl } },
    });

    entries.push({
      url: frUrl,
      lastModified: now,
      changeFrequency,
      priority: priority - 0.05,
      alternates: { languages: { en: enUrl, fr: frUrl } },
    });
  }

  return entries;
}
