import { reviewRepository } from "@/lib/repositories/review.repository";
import { propertyRepository } from "@/lib/repositories/property.repository";
import { NotFoundError } from "@/lib/errors";
import type { CreateReviewInput } from "@/lib/validation/schemas";
import type { PropertyReview } from "@/lib/types";

export interface PropertyReviewsResult {
  propertyId: string;
  averageRating: number | null;
  count: number;
  reviews: PropertyReview[];
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

  async create(
    propertyId: string,
    input: CreateReviewInput,
  ): Promise<PropertyReview> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundError(`Property ${propertyId} not found`);
    return reviewRepository.create({ propertyId, ...input });
  },
};
