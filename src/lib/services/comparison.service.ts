import { propertyRepository } from "@/lib/repositories/property.repository";
import { propertyService } from "@/lib/services/property.service";
import { compareProperties } from "@/lib/scoring";
import { ValidationError } from "@/lib/errors";
import { MIN_COMPARE, MAX_COMPARE } from "@/lib/constants";
import type { ComparisonResult, Property } from "@/lib/types";

export interface ComparisonPayload {
  /** Rule-based scoring output (overall/investment scores, ranking, awards). */
  result: ComparisonResult;
  /** Full property records that were compared, in request order. */
  properties: Property[];
  /** A few suggested alternatives not in the comparison set. */
  similar: Property[];
}

/**
 * Orchestrates a comparison: load properties → run the (pure, deterministic)
 * rule-based engine → attach alternatives. This is the single entry point an
 * AI scoring service would later wrap or replace (see `ai.service.ts`).
 */
export const comparisonService = {
  async compare(ids: string[]): Promise<ComparisonPayload> {
    const unique = Array.from(new Set(ids));
    if (unique.length < MIN_COMPARE)
      throw new ValidationError(
        `Select at least ${MIN_COMPARE} properties to compare`,
      );
    if (unique.length > MAX_COMPARE)
      throw new ValidationError(
        `You can compare up to ${MAX_COMPARE} properties`,
      );

    const properties = await propertyRepository.findByIds(unique);
    if (properties.length < MIN_COMPARE)
      throw new ValidationError("Some selected properties could not be found");

    const result = compareProperties(properties);
    const similar = await propertyService.getSimilar(
      properties.map((p) => p.id),
      3,
    );

    return { result, properties, similar };
  },
};
