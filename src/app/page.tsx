import type { Metadata } from "next";
import { getDataSource } from "@/lib/data-source";
import { type HeroSlide } from "@/components/landing/hero-3d";
import { HeroShowcase } from "@/components/landing/hero-showcase";
import { HeroSlot } from "@/components/landing/hero-slot";
import { PropertyExplorer } from "@/components/listing/property-explorer";
import { ReviewSection } from "@/components/landing/review-section";
import { bannerService } from "@/lib/services/banner.service";
import { reviewService } from "@/lib/services/review.service";
import { compareProperties } from "@/lib/scoring";
import { formatPriceLakh } from "@/lib/utils";
import type { Property } from "@/lib/types";

/** Trios of real properties for the hero, scored the same way the product does. */
const HERO_SLIDES = 4; // initial + up to 3 rotations

function buildHeroSlides(properties: Property[]): HeroSlide[] {
  // Only projects with a real photo — the hero is the shop window, and a
  // gradient placeholder there reads as a broken image rather than a design.
  const withPhotos = properties.filter((p) => p.image);

  const slides: HeroSlide[] = [];
  for (let i = 0; i + 3 <= withPhotos.length && slides.length < HERO_SLIDES; i += 3) {
    const trio = withPhotos.slice(i, i + 3);
    // Scores are normalised across the compared set, so a trio has to be scored
    // together — that is exactly what the hero depicts.
    const { scores, ranking } = compareProperties(trio);
    const winnerId = ranking[0];

    const toCard = (p: Property) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      meta: `${p.locality} · ${p.kind}`,
      price: p.priceLakh > 0 ? formatPriceLakh(p.priceLakh) : "Price on request",
      image: p.image,
      gradient: p.gradient,
      score: scores[p.id].overall,
    });

    const winner = trio.find((p) => p.id === winnerId) ?? trio[0];
    const deck = trio.filter((p) => p.id !== winner.id).map(toCard);
    if (deck.length < 2) continue;

    slides.push({ deck: [deck[0], deck[1]], winner: toCard(winner) });
  }
  return slides;
}

export const metadata: Metadata = {
  title: "Compare NCR Properties",
  description:
    "Compare flats in Noida, Greater Noida, Ghaziabad and Yamuna Expressway. Side-by-side scores for price, amenities, location, builder and ROI.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Compare NCR Properties · Creators Arena",
    description:
      "Compare flats in Noida, Greater Noida, Ghaziabad and Yamuna Expressway side-by-side.",
    url: "/",
  },
};

// DB-backed: render at request time, not build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Reviews are decorative here: a failure falls back to the curated copy
  // rather than taking down the home page.
  const [properties, banners, recentReviews] = await Promise.all([
    getDataSource().list(),
    bannerService.live(),
    reviewService.listRecent(12).catch(() => []),
  ]);
  // Stable across a calendar day so crawlers don't see a different shuffle
  // on every hit. The explorer still shuffles; it just stops changing hourly.
  const seed = (Math.floor(Date.now() / 86_400_000) % 1000) / 1000;

  return (
    <>
      {/* Hero and banners share one rotating stage: the client's read was that
          a hero alone added no value, so the promotions now get the same room
          rather than a strip below the fold. With no live banners this is the
          hero on its own, exactly as before.

          The slot around it stands the stage down while a search started in the
          navbar is running, so the results below land directly under the search
          box instead of a screen-height scroll away. */}
      <HeroSlot>
        <HeroShowcase
          slides={buildHeroSlides(properties)}
          banners={banners}
          // The same array the explorer below is given, so the hero's count and
          // the grid are one number rather than two that drift.
          projectCount={properties.length}
        />
      </HeroSlot>
      <PropertyExplorer
        initial={properties}
        seed={seed}
        variant="browse"
        title="Featured properties by location"
        subtitle="Browse live NCR projects grouped by location, then shortlist 2–4 to compare."
      />
      {/* Real reviews once any exist; the curated launch copy until then. */}
      <ReviewSection reviews={recentReviews} />
    </>
  );
}
