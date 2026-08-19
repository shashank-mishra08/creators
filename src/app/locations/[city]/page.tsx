import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { CollectionLanding } from "@/components/seo/collection-landing";
import { cityLandingCopy, cityPath, findBySlug } from "@/lib/seo";
import { propertyService } from "@/lib/services/property.service";

export const dynamic = "force-dynamic";

const loadCity = cache(async function loadCity(slug: string) {
  const cities = await propertyService.cityCounts();
  const city = findBySlug(cities, slug, (c) => c.name);
  if (!city) return null;
  const properties = await propertyService.list({ city: city.name });
  return { city, properties };
});

export async function generateMetadata({
  params,
}: {
  params: { city: string };
}): Promise<Metadata> {
  const loaded = await loadCity(params.city);
  if (!loaded) return { title: "Location not found", robots: { index: false } };
  const copy = cityLandingCopy(loaded.city.name, loaded.properties);
  const path = cityPath(loaded.city.name);
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: path },
    openGraph: {
      title: `${copy.title} · Creators Arena`,
      description: copy.description,
      url: path,
    },
  };
}

export default async function CityPage({ params }: { params: { city: string } }) {
  const loaded = await loadCity(params.city);
  if (!loaded) notFound();
  const { city, properties } = loaded;
  const copy = cityLandingCopy(city.name, properties);
  const path = cityPath(city.name);

  return (
    <CollectionLanding
      title={copy.title}
      intro={copy.intro}
      path={path}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Locations", path: "/locations" },
        { name: city.name, path },
      ]}
      properties={properties}
      faqs={copy.faqs}
      explorerTitle={`Projects in ${city.name}`}
    />
  );
}
