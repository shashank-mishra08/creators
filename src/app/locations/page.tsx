import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, cityPath } from "@/lib/seo";
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
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Locations", path: "/locations" },
            ]),
          ],
        }}
      />
      <div className="container py-12">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-primary dark:text-foreground sm:text-4xl">
          Properties by location in NCR
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Open a micro-market to compare live projects on price, BHK, possession
          and connectivity. Listings update as the Noida team publishes them.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <li key={c.name}>
              <Link
                href={cityPath(c.name)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-4 shadow-glass transition-colors hover:border-accent/50 hover:bg-accent/5"
              >
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <MapPin className="h-4 w-4 text-accent" />
                  {c.name}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {c.count} {c.count === 1 ? "project" : "projects"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
