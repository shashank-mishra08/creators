import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { CollectionLanding } from "@/components/seo/collection-landing";
import { builderLandingCopy, builderPath, findBySlug } from "@/lib/seo";
import { propertyService } from "@/lib/services/property.service";

export const dynamic = "force-dynamic";

const loadBuilder = cache(async function loadBuilder(slug: string) {
  const names = await propertyService.builderNames();
  const name = findBySlug(names, slug, (n) => n);
  if (!name) return null;
  const properties = await propertyService.list({ builder: name });
  return { name, properties };
});

export async function generateMetadata({
  params,
}: {
  params: { builder: string };
}): Promise<Metadata> {
  const loaded = await loadBuilder(params.builder);
  if (!loaded) return { title: "Builder not found", robots: { index: false } };
  const copy = builderLandingCopy(loaded.name, loaded.properties);
  const path = builderPath(loaded.name);
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

export default async function BuilderPage({
  params,
}: {
  params: { builder: string };
}) {
  const loaded = await loadBuilder(params.builder);
  if (!loaded) notFound();
  const { name, properties } = loaded;
  const copy = builderLandingCopy(name, properties);
  const path = builderPath(name);

  return (
    <CollectionLanding
      title={copy.title}
      intro={copy.intro}
      path={path}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Builders", path: "/builders" },
        { name, path },
      ]}
      properties={properties}
      faqs={copy.faqs}
      explorerTitle={`${name} projects`}
    />
  );
}
