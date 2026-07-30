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
export interface MyReview extends PropertyReview {
  propertyName: string;
  propertyLocality: string;
  propertyImage: string;
}

export interface MyReviewsResult {
  reviews: MyReview[];
  /** Most-reviewed properties first — the form's "Popular Searches" chips. */
  popularPropertyIds: string[];
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
      reviews: reviews.flatMap((r) => {
        const p = byId.get(r.propertyId);
        if (!p) return [];
        return [
          {
            ...r,
            propertyName: `${p.builder.name} ${p.name}`.trim(),
            propertyLocality: p.locality,
            propertyImage: p.image,
          },
        ];
      }),
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
