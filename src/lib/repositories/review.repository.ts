import { prisma } from "@/lib/db/prisma";
import type { PropertyReview } from "@/lib/types";

type ReviewRow = {
  id: string;
  propertyId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

function mapReview(r: ReviewRow): PropertyReview {
  return {
    id: r.id,
    propertyId: r.propertyId,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  };
}

export interface CreateReviewInput {
  propertyId: string;
  authorName: string;
  rating: number;
  comment: string;
  userId?: string | null;
}

export const reviewRepository = {
  async findByPropertyId(propertyId: string): Promise<PropertyReview[]> {
    const rows = await prisma.review.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapReview);
  },

  async averageRating(propertyId: string): Promise<number | null> {
    const agg = await prisma.review.aggregate({
      where: { propertyId },
      _avg: { rating: true },
    });
    return agg._avg.rating;
  },

  async create(input: CreateReviewInput): Promise<PropertyReview> {
    const row = await prisma.review.create({
      data: {
        propertyId: input.propertyId,
        authorName: input.authorName,
        rating: input.rating,
        comment: input.comment,
        userId: input.userId ?? null,
      },
    });
    return mapReview(row);
  },
};
