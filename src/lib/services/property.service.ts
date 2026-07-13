import { propertyRepository } from "@/lib/repositories/property.repository";
import { NotFoundError } from "@/lib/errors";
import type { PropertyFilters } from "@/lib/data-source";
import type { Property } from "@/lib/types";

const bhkNums = (p: Property) =>
  new Set((p.configs.match(/\d+/g) ?? []).map(Number));

/**
 * Relevance score of candidate `b` against reference `a` (higher = more
 * similar). Blends the factors that make a suggestion feel relevant rather than
 * merely co-located: location, builder, price band, property type, BHK overlap
 * and category — so "Similar Properties" are genuinely comparable alternatives.
 */
function similarityScore(a: Property, b: Property): number {
  let score = 0;
  // Location is the dominant signal (priority: micro-location > locality > city).
  if (a.locality && a.locality === b.locality) score += 45; // same sector/locality
  if (a.city === b.city) score += 30; // same city / micro-market
  if (a.priceLakh > 0 && b.priceLakh > 0) {
    // price closeness: identical → 20, further apart → less
    const ratio = Math.min(a.priceLakh, b.priceLakh) / Math.max(a.priceLakh, b.priceLakh);
    score += ratio * 20; // similar budget
  }
  if (a.kind === b.kind) score += 12; // same property type
  if (a.builder.name === b.builder.name) score += 15; // same developer
  const av = bhkNums(a);
  const bv = bhkNums(b);
  const union = new Set([...av, ...bv]).size;
  if (union > 0) {
    const overlap = [...av].filter((x) => bv.has(x)).length;
    score += (overlap / union) * 12; // shared unit configurations
  }
  if (a.subtitle && a.subtitle === b.subtitle) score += 6; // category label
  return score;
}

/**
 * Property business logic. Routes/components call the service; the service calls
 * the repository. No Prisma usage here, no business logic in routes.
 */
export const propertyService = {
  list(filters?: PropertyFilters): Promise<Property[]> {
    return propertyRepository.findMany(filters);
  },

  getByIds(ids: string[]): Promise<Property[]> {
    return propertyRepository.findByIds(ids);
  },

  async getByIdOrThrow(id: string): Promise<Property> {
    const property = await propertyRepository.findById(id);
    if (!property) throw new NotFoundError(`Property ${id} not found`);
    return property;
  },

  getById(id: string): Promise<Property | null> {
    return propertyRepository.findById(id);
  },

  /**
   * Suggest the `take` most relevant properties to the referenced one(s).
   * Scores every other property against each reference (best match wins, so a
   * candidate relevant to ANY compared property surfaces) and returns the top
   * matches; falls back to the newest properties if there are no references.
   */
  async getSimilar(referenceIds: string[], take = 3): Promise<Property[]> {
    const [references, candidates] = await Promise.all([
      propertyRepository.findByIds(referenceIds),
      propertyRepository.findExcluding(referenceIds, 1000),
    ]);
    if (references.length === 0) return candidates.slice(0, take);

    const refCities = new Set(references.map((r) => r.city));
    return candidates
      .map((c) => ({
        c,
        sameCity: refCities.has(c.city),
        score: Math.max(...references.map((r) => similarityScore(r, c))),
      }))
      // Same-city candidates always rank first (never recommend an unrelated
      // location while relevant same-city options exist); then by relevance.
      .sort(
        (x, y) =>
          Number(y.sameCity) - Number(x.sameCity) || y.score - x.score,
      )
      .slice(0, take)
      .map((x) => x.c);
  },

  builderNames(): Promise<string[]> {
    return propertyRepository.distinctBuilderNames();
  },
};
