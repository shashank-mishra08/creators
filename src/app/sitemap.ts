import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { builderPath, cityPath, propertyPath } from "@/lib/seo";
import { propertyService } from "@/lib/services/property.service";

// Regenerated per request so newly imported properties appear without a rebuild.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/properties`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/locations`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/builders`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${SITE_URL}/compare/quick`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
  ];

  let extra: MetadataRoute.Sitemap = [];
  try {
    const [properties, cities, builders] = await Promise.all([
      propertyService.list(),
      propertyService.cityCounts(),
      propertyService.builderNames(),
    ]);
    extra = [
      ...cities.map((c) => ({
        url: `${SITE_URL}${cityPath(c.name)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
      ...builders.map((name) => ({
        url: `${SITE_URL}${builderPath(name)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
      ...properties.map((p) => ({
        url: `${SITE_URL}${propertyPath(p)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // If the DB is unavailable, still serve the static routes.
  }

  // De-dupe in case a city/builder slug collides with a static path (it should not).
  const seen = new Set<string>();
  return [...staticRoutes, ...extra].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
