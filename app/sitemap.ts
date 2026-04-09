import type { MetadataRoute } from "next";
import { getSeoContext } from "@/lib/seo";
import {
  LLM_MODELS,
  FEATURED_COMPARISONS,
  INTEGRATIONS,
  GLOSSARY_TERMS,
} from "@/lib/pseo-data";

const waitlistEnabled = process.env.ENABLE_WAITLIST === "true";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { isAppSubdomain, marketingUrl } = await getSeoContext();

  if (isAppSubdomain) return [];

  const BASE_URL = marketingUrl;
  const now = new Date();

  const staticPages: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/features", changeFrequency: "monthly", priority: 0.9 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/changelog", changeFrequency: "weekly", priority: 0.6 },
    { path: "/careers", changeFrequency: "monthly", priority: 0.5 },
    { path: "/models", changeFrequency: "weekly", priority: 0.8 },
    { path: "/compare", changeFrequency: "weekly", priority: 0.8 },
    { path: "/integrations", changeFrequency: "monthly", priority: 0.8 },
    { path: "/learn", changeFrequency: "monthly", priority: 0.7 },
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

  // Static pages — EN + FR
  for (const { path, changeFrequency, priority } of staticPages) {
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

  // pSEO — models
  for (const model of LLM_MODELS) {
    const enUrl = `${BASE_URL}/models/${model.slug}`;
    const frUrl = `${BASE_URL}/fr/models/${model.slug}`;
    entries.push({
      url: enUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: { en: enUrl, fr: frUrl } },
    });
  }

  // pSEO — comparisons
  for (const comparison of FEATURED_COMPARISONS) {
    const enUrl = `${BASE_URL}/compare/${comparison}`;
    const frUrl = `${BASE_URL}/fr/compare/${comparison}`;
    entries.push({
      url: enUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: { en: enUrl, fr: frUrl } },
    });
  }

  // pSEO — integrations
  for (const integration of INTEGRATIONS) {
    const enUrl = `${BASE_URL}/integrations/${integration.slug}`;
    const frUrl = `${BASE_URL}/fr/integrations/${integration.slug}`;
    entries.push({
      url: enUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: { languages: { en: enUrl, fr: frUrl } },
    });
  }

  // pSEO — glossary
  for (const term of GLOSSARY_TERMS) {
    const enUrl = `${BASE_URL}/learn/${term.slug}`;
    const frUrl = `${BASE_URL}/fr/learn/${term.slug}`;
    entries.push({
      url: enUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: { languages: { en: enUrl, fr: frUrl } },
    });
  }

  return entries;
}
