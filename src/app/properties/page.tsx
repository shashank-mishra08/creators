import type { Metadata } from "next";
import { getDataSource } from "@/lib/data-source";
import { PropertyExplorer } from "@/components/listing/property-explorer";

export const metadata: Metadata = {
  title: "NCR flats & apartments for sale",
  description:
    "Browse residential projects across Noida, Greater Noida, Ghaziabad and Yamuna Expressway. Filter by city, BHK, budget and possession, then compare side-by-side.",
  alternates: { canonical: "/properties" },
  openGraph: {
    title: "NCR flats & apartments for sale · Creators Arena",
    description:
      "Browse and shortlist NCR residential properties to compare side-by-side.",
    url: "/properties",
  },
};

// DB-backed: render at request time, not build time.
export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const properties = await getDataSource().list();
  return (
    <>
      <div className="container pt-8 pb-0">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-primary dark:text-foreground sm:text-4xl">
          NCR properties for sale
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Filter live projects in Noida, Greater Noida, Ghaziabad and Yamuna
          Expressway, then shortlist 2–4 to compare.
        </p>
      </div>
      <PropertyExplorer
        initial={properties}
        // Browse layout: collapsed filter groups, brand-first order, no Location
        // group (the picker in the search bar covers it), compact search bar and
        // the segment tabs as a dropdown. The home page keeps the featured layout.
        variant="browse"
        title="Select properties to compare"
        subtitle="Pick 2–4 homes and hit Compare to see a full side-by-side analysis with a recommendation score."
      />
    </>
  );
}
