import type { Metadata } from "next";
import { getDataSource } from "@/lib/data-source";
import { Hero3D } from "@/components/landing/hero-3d";
import { PropertyExplorer } from "@/components/listing/property-explorer";

// Title/description/OG inherited from the root layout; set the home canonical.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// DB-backed: render at request time, not build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const properties = await getDataSource().list();
  return (
    <>
      {/* Hero is a fixed marketing illustration — intentionally NOT fed live
          property data, so it never changes when the database grows. */}
      <Hero3D />
      <PropertyExplorer
        initial={properties}
        title="Featured properties by location"
        subtitle="Browse live NCR projects grouped by location, then shortlist 2–4 to compare."
      />
    </>
  );
}
