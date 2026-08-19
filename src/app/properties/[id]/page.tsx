import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { getDataSource } from "@/lib/data-source";
import { propertyService } from "@/lib/services/property.service";
import { reviewService } from "@/lib/services/review.service";
import { settingsService } from "@/lib/services/settings.service";
import { PropertyDetail } from "@/components/property/property-detail";
import { JsonLd } from "@/components/seo/json-ld";
import { isUuid } from "@/lib/repositories/property.repository";
import {
  absoluteMediaUrl,
  propertyDescription,
  propertyJsonLd,
  propertyPath,
  propertyTitle,
} from "@/lib/seo";

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

  const title = propertyTitle(property);
  const description = propertyDescription(property);
  const url = propertyPath(property);
  const image = absoluteMediaUrl(property.image) || "/art/skyline.png";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${property.name} · Creators Arena`,
      description,
      url,
      images: [{ url: image, alt: `${property.name} in ${property.locality}, ${property.city}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${property.name} · Creators Arena`,
      description,
      images: [image],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const property = await loadProperty(params.id);
  if (!property) notFound();

  // Old UUID links keep working; send crawlers to the stable slug URL.
  // Does not write anything — slug is already on the row.
  if (isUuid(params.id) && property.slug && params.id !== property.slug) {
    permanentRedirect(propertyPath(property));
  }

  // Similar/reviews key off the UUID primary key. `getSimilar` only accepts
  // UUIDs (compare/shortlist do too), so we use the loaded row's id — not the
  // public slug in the URL.
  const [similar, reviews, publicSettings] = await Promise.all([
    propertyService.getSimilar([property.id], 3),
    reviewService.listForProperty(property.id).catch(() => null),
    settingsService.getPublic().catch(() => null),
  ]);

  return (
    <>
      <JsonLd data={propertyJsonLd(property, reviews)} />
      <PropertyDetail
        property={property}
        similar={similar}
        reviewAvg={reviews?.averageRating ?? null}
        reviewCount={reviews?.reviews.length ?? 0}
        reviews={reviews?.reviews ?? []}
        contactPhone={publicSettings?.contactPhone || undefined}
      />
    </>
  );
}
