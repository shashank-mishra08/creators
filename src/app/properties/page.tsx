import type { Metadata } from "next";
import { getDataSource } from "@/lib/data-source";
import { PropertyExplorer } from "@/components/listing/property-explorer";

export const metadata: Metadata = {
  title: "Browse NCR properties",
  description:
    "Browse and shortlist NCR residential properties to compare side-by-side.",
  alternates: { canonical: "/properties" },
  openGraph: {
    title: "Browse NCR properties · Creators Arena",
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
      {/* Page heading for a11y/SEO; the visible UI leads with filters + tabs. */}
      <h1 className="sr-only">Browse and compare NCR residential properties</h1>
      <PropertyExplorer
        initial={properties}
        title="Select properties to compare"
        subtitle="Pick 2–4 homes and hit Compare to see a full side-by-side analysis with a recommendation score."
      />
    </>
  );
}
