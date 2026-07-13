import { comparisonService } from "@/lib/services/comparison.service";
import { WEIGHTS } from "@/lib/scoring";
import type { Property } from "@/lib/types";

/**
 * AI-readiness layer.
 *
 * We are NOT building the AI model here. This service shapes property data into a
 * stable, structured "context" that a future AI comparison/scoring service can
 * consume directly (its own microservice, an LLM prompt, or a vector pipeline).
 *
 * The contract: numeric `features` per property + the current rule-based result.
 * An AI module can replace/augment `result` while reusing `features`.
 */

export interface PropertyFeatureVector {
  propertyId: string;
  name: string;
  features: {
    priceLakh: number;
    pricePerSqFt: number;
    areaAcres: number;
    towers: number;
    amenitiesCount: number;
    connectivityIndex: number;
    appreciationPct: number;
    rentalYieldPct: number;
    demandIndex: number;
    builderRating: number;
    builderDeliveredProjects: number;
  };
}

export interface AIComparisonContext {
  schemaVersion: string;
  generatedAt: string;
  /** Weighting scheme used by the deterministic engine (AI may override). */
  weights: typeof WEIGHTS;
  featureVectors: PropertyFeatureVector[];
  /** Current rule-based result, so AI output can be compared/blended. */
  ruleBased: Awaited<ReturnType<typeof comparisonService.compare>>["result"];
}

function toFeatureVector(p: Property): PropertyFeatureVector {
  return {
    propertyId: p.id,
    name: p.name,
    features: {
      priceLakh: p.priceLakh,
      pricePerSqFt: p.pricePerSqFt,
      areaAcres: p.areaAcres,
      towers: p.towers,
      amenitiesCount: Object.values(p.amenities).filter(Boolean).length,
      connectivityIndex: p.location.connectivityIndex,
      appreciationPct: p.investment.appreciationPct,
      rentalYieldPct: p.investment.rentalYieldPct,
      demandIndex: p.investment.demandIndex,
      builderRating: p.builder.rating,
      builderDeliveredProjects: p.builder.deliveredProjects,
    },
  };
}

export const aiService = {
  async buildComparisonContext(ids: string[]): Promise<AIComparisonContext> {
    const { properties, result } = await comparisonService.compare(ids);
    return {
      schemaVersion: "1.0",
      generatedAt: new Date().toISOString(),
      weights: WEIGHTS,
      featureVectors: properties.map(toFeatureVector),
      ruleBased: result,
    };
  },
};
