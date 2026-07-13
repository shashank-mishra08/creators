import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getDataSource } from "@/lib/data-source";
import { propertyService } from "@/lib/services/property.service";
import { reviewService } from "@/lib/services/review.service";
import { PropertyDetail } from "@/components/property/property-detail";
import { formatPriceLakh } from "@/lib/utils";
import { SITE_URL } from "@/lib/constants";
import type { Property } from "@/lib/types";
import type { PropertyReviewsResult } from "@/lib/services/review.service";

// DB-backed: render at request time.
export const dynamic = "force-dynamic";

// Cached per request so `generateMetadata` and the page share ONE DB query
// (React dedupes within a request) — keeps the Phase-4 single-fetch win.
const loadProperty = cache((id: string) => getDataSource().get(id));

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const property = await loadProperty(params.id);
  if (!property) {
    return { title: "Property not found", robots: { index: false } };
  }

  const priceBit =
    property.priceLakh > 0 ? ` from ${formatPriceLakh(property.priceLakh)}` : "";
  const title = `${property.name} — ${property.locality}, ${property.city}`;
  const description = `${property.name} by ${property.builder.name} in ${property.locality}, ${property.city}. ${
    property.configs || "Residential"
  }${priceBit}. Compare price, amenities, location and investment potential on Creators Arena.`;
  const url = `/properties/${property.id}`;
  const image = property.image || "/art/skyline.png";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${property.name} · Creators Arena`,
      description,
      url,
      images: [{ url: image, alt: property.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${property.name} · Creators Arena`,
      description,
      images: [image],
    },
  };
}

/** schema.org structured data for rich results (Product + Offer + Breadcrumb). */
function buildJsonLd(property: Property, reviews: PropertyReviewsResult | null) {
  const url = `${SITE_URL}/properties/${property.id}`;
  const product: Record<string, unknown> = {
    "@type": "Product",
    name: property.name,
    description: `${property.name} by ${property.builder.name}, ${property.locality}, ${property.city}`,
    url,
    category: property.kind,
    brand: { "@type": "Organization", name: property.builder.name },
  };
  if (property.image) product.image = `${SITE_URL}${property.image}`;
  if (property.priceLakh > 0) {
    product.offers = {
      "@type": "Offer",
      price: Math.round(property.priceLakh * 100000), // lakh → INR
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url,
    };
  }
  if (reviews && reviews.averageRating != null && reviews.count > 0) {
    product.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviews.averageRating,
      reviewCount: reviews.count,
    };
  }
  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Properties", item: `${SITE_URL}/properties` },
      { "@type": "ListItem", position: 3, name: property.name, item: url },
    ],
  };
  return { "@context": "https://schema.org", "@graph": [product, breadcrumb] };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // The three reads are independent, so run them in parallel instead of three
  // sequential round-trips. `getSimilar` fetches only 3 rows at the DB (was
  // `list()` loading all properties with every relation just to slice 3).
  // Reviews are non-critical, so a failure resolves to null rather than throwing.
  const [property, similar, reviews] = await Promise.all([
    loadProperty(params.id),
    propertyService.getSimilar([params.id], 3),
    reviewService.listForProperty(params.id).catch(() => null),
  ]);

  if (!property) notFound();

  const jsonLd = buildJsonLd(property, reviews);

  return (
    <>
      {/* Escape "<" so property text can never break out of the script tag. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PropertyDetail
        property={property}
        similar={similar}
        reviewAvg={reviews?.averageRating ?? null}
        reviewCount={reviews?.reviews.length ?? 0}
      />
    </>
  );
}
