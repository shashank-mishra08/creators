import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { DirectoryIndex } from "@/components/seo/directory-index";
import { cityPath } from "@/lib/seo";
import { propertyService } from "@/lib/services/property.service";

export const metadata: Metadata = {
  title: "NCR locations",
  description:
    "Browse residential projects by location — Noida Expressway, Greater Noida, Greater Noida West, Ghaziabad and Yamuna Expressway.",
  alternates: { canonical: "/locations" },
  openGraph: {
    title: "NCR property locations · Creators Arena",
    description:
      "Browse live residential projects across Noida, Greater Noida, Ghaziabad and Yamuna Expressway.",
    url: "/locations",
  },
};

export const dynamic = "force-dynamic";

export default async function LocationsIndexPage() {
  const cities = await propertyService.cityCounts();

  return (
    <DirectoryIndex
      eyebrow="Locations"
      title="Browse by location"
      subtitle="Pick a micro-market, then compare live projects on price, BHK and possession."
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Locations", path: "/locations" },
      ]}
      items={cities.map((c) => ({
        name: c.name,
        count: c.count,
        href: cityPath(c.name),
      }))}
      icon={MapPin}
    />
  );
}
