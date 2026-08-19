import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { propertyPath } from "@/lib/seo";
import { propertyService } from "@/lib/services/property.service";

// Regenerated per request so newly imported properties appear without a rebuild.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/properties`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${SITE_URL}/compare/quick`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
  ];

  let propertyRoutes: MetadataRoute.Sitemap = [];
  try {
    const properties = await propertyService.list();
    propertyRoutes = properties.map((p) => ({
      url: `${SITE_URL}${propertyPath(p)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // If the DB is unavailable, still serve the static routes.
  }

  return [...staticRoutes, ...propertyRoutes];
}
