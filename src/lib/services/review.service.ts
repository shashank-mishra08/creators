import { reviewRepository } from "@/lib/repositories/review.repository";
import { propertyRepository } from "@/lib/repositories/property.repository";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import type { CreateReviewInput } from "@/lib/validation/schemas";
import type { PropertyReview } from "@/lib/types";

export interface PropertyReviewsResult {
  propertyId: string;
  averageRating: number | null;
  count: number;
  reviews: PropertyReview[];
}

/** A review joined to just enough of its property to render a card. */
export interface ReviewWithProperty extends PropertyReview {
  propertyId: string;
  propertyName: string;
  propertyLocality: string;
  propertyCity: string;
  propertyImage: string;
}

/** Kept as an alias so existing callers read naturally. */
export type MyReview = ReviewWithProperty;

export interface MyReviewsResult {
  reviews: MyReview[];
  /** Most-reviewed properties first — the form's "Popular Searches" chips. */
  popularPropertyIds: string[];
}

/**
 * Attach property display fields, dropping any review whose property is not in
 * the map. `propertyRepository.findByIds` applies the public visibility rule, so
 * a review of a property that was since hidden or soft-deleted disappears here
 * rather than surfacing as a dead link.
 */
function joinProperties(
  reviews: PropertyReview[],
  byId: Map<string, { name: string; locality: string; city: string; image: string; builder: { name: string } }>,
): ReviewWithProperty[] {
  return reviews.flatMap((r) => {
    const p = byId.get(r.propertyId);
    if (!p) return [];
    return [
      {
        ...r,
        propertyName: `${p.builder.name} ${p.name}`.trim(),
        propertyLocality: p.locality,
        propertyCity: p.city,
        propertyImage: p.image,
      },
    ];
  });
}

export const reviewService = {
  async listForProperty(propertyId: string): Promise<PropertyReviewsResult> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundError(`Property ${propertyId} not found`);

    const [reviews, averageRating] = await Promise.all([
      reviewRepository.findByPropertyId(propertyId),
      reviewRepository.averageRating(propertyId),
    ]);
    return {
      propertyId,
      averageRating: averageRating != null ? Number(averageRating.toFixed(2)) : null,
      count: reviews.length,
      reviews,
    };
  },

  /**
   * The newest reviews across the whole catalogue, for the home page strip.
   *
   * Over-fetches deliberately: some of the newest reviews may belong to a
   * property that is now hidden, and those are dropped by the join — so asking
   * for exactly `limit` rows could return fewer than `limit` cards.
   */
  async listRecent(limit = 12): Promise<ReviewWithProperty[]> {
    const reviews = await reviewRepository.findRecent(limit * 2);
    if (reviews.length === 0) return [];

    const properties = await propertyRepository.findByIds(
      [...new Set(reviews.map((r) => r.propertyId))],
    );
    const byId = new Map(properties.map((p) => [p.id, p]));
    return joinProperties(reviews, byId).slice(0, limit);
  },

  /**
   * The signed-in user's own reviews, plus the popularity ranking the form uses.
   *
   * Properties are resolved through `propertyRepository.findByIds`, which
   * applies the public visibility rule — so a review of a property that was
   * since hidden or deleted is dropped rather than surfacing a dead link.
   */
  async listForUser(userId: string, popularLimit = 5): Promise<MyReviewsResult> {
    const [reviews, popularPropertyIds] = await Promise.all([
      reviewRepository.findByUserId(userId),
      reviewRepository.mostReviewedPropertyIds(popularLimit),
    ]);

    const properties = await propertyRepository.findByIds(
      [...new Set(reviews.map((r) => r.propertyId))],
    );
    const byId = new Map(properties.map((p) => [p.id, p]));

    return {
      reviews: joinProperties(reviews, byId),
      popularPropertyIds,
    };
  },

  async create(
    propertyId: string,
    input: CreateReviewInput,
  ): Promise<PropertyReview> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundError(`Property ${propertyId} not found`);

    // One review per person per property. Enforced here rather than with a
    // database constraint to keep the schema change purely additive; the window
    // for a duplicate is a double-submit, which the form also guards against.
    if (input.userId) {
      const already = await reviewRepository.existsForUser(propertyId, input.userId);
      if (already) {
        throw new BadRequestError(
          "You have already reviewed this property. Delete your existing review to write a new one.",
        );
      }
    }

    return reviewRepository.create({ propertyId, ...input });
  },

  /** Delete the caller's own review. Returns false when it isn't theirs. */
  async removeOwn(id: string, userId: string): Promise<boolean> {
    return reviewRepository.removeOwn(id, userId);
  },
};
