import type { Metadata } from "next";
import { getDataSource } from "@/lib/data-source";
import { Hero3D, type HeroSlide } from "@/components/landing/hero-3d";
import { BannerCarousel } from "@/components/landing/banner-carousel";
import { PropertyExplorer } from "@/components/listing/property-explorer";
import { ReviewSection } from "@/components/landing/review-section";
import { bannerService } from "@/lib/services/banner.service";
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

// Title/description/OG inherited from the root layout; set the home canonical.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// DB-backed: render at request time, not build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [properties, banners] = await Promise.all([
    getDataSource().list(),
    bannerService.live(),
  ]);
  const seed = Math.random();
  return (
    <>
      {/* Hero cards show real listings, rotating a few times before settling.
          (Previously a fixed illustration; the client asked for live stock.) */}
      <Hero3D slides={buildHeroSlides(properties)} />
      {/* Renders nothing until an admin publishes a banner. */}
      <BannerCarousel banners={banners} />
      <PropertyExplorer
        initial={properties}
        seed={seed}
        title="Featured properties by location"
        subtitle="Browse live NCR projects grouped by location, then shortlist 2–4 to compare."
      />
      <ReviewSection />
    </>
  );
}
