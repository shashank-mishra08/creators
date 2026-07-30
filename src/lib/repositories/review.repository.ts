import { prisma } from "@/lib/db/prisma";
import type { PropertyReview } from "@/lib/types";

type ReviewRow = {
  id: string;
  propertyId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  ratingLocation: number | null;
  ratingAmenities: number | null;
  ratingConstruction: number | null;
  ratingValue: number | null;
  ratingConnectivity: number | null;
  photos: string[] | null;
};

function mapReview(r: ReviewRow): PropertyReview {
  return {
    id: r.id,
    propertyId: r.propertyId,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    aspects: {
      location: r.ratingLocation,
      amenities: r.ratingAmenities,
      construction: r.ratingConstruction,
      value: r.ratingValue,
      connectivity: r.ratingConnectivity,
    },
    // The column is nullable at the database level (that is how Prisma emits
    // list columns), so coalesce rather than assuming the array is there.
    photos: r.photos ?? [],
  };
}

/** Every column the mapper needs, in one place so all read paths agree. */
const selectReview = {
  id: true,
  propertyId: true,
  authorName: true,
  rating: true,
  comment: true,
  createdAt: true,
  ratingLocation: true,
  ratingAmenities: true,
  ratingConstruction: true,
  ratingValue: true,
  ratingConnectivity: true,
  photos: true,
} as const;

export interface CreateReviewInput {
  propertyId: string;
  authorName: string;
  rating: number;
  comment: string;
  userId?: string | null;
  aspects?: {
    location?: number | null;
    amenities?: number | null;
    construction?: number | null;
    value?: number | null;
    connectivity?: number | null;
  };
  photos?: string[];
}

export const reviewRepository = {
  async findByPropertyId(propertyId: string): Promise<PropertyReview[]> {
    const rows = await prisma.review.findMany({
      where: { propertyId },
      select: selectReview,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapReview);
  },

  /** The newest reviews across every property (powers the home page strip). */
  async findRecent(take: number): Promise<PropertyReview[]> {
    const rows = await prisma.review.findMany({
      select: selectReview,
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows.map(mapReview);
  },

  /** Reviews written by one user, newest first (powers "Your reviews"). */
  async findByUserId(userId: string): Promise<PropertyReview[]> {
    const rows = await prisma.review.findMany({
      where: { userId },
      select: selectReview,
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

  /** True when this user has already reviewed this property. */
  async existsForUser(propertyId: string, userId: string): Promise<boolean> {
    const found = await prisma.review.findFirst({
      where: { propertyId, userId },
      select: { id: true },
    });
    return found !== null;
  },

  /** Property ids carrying the most reviews, most-reviewed first. */
  async mostReviewedPropertyIds(limit: number): Promise<string[]> {
    const rows = await prisma.review.groupBy({
      by: ["propertyId"],
      _count: { propertyId: true },
      orderBy: { _count: { propertyId: "desc" } },
      take: limit,
    });
    return rows.map((r) => r.propertyId);
  },

  /** One review per user, so this deletes the caller's own review only. */
  async removeOwn(id: string, userId: string): Promise<boolean> {
    const { count } = await prisma.review.deleteMany({ where: { id, userId } });
    return count > 0;
  },

  async create(input: CreateReviewInput): Promise<PropertyReview> {
    const row = await prisma.review.create({
      data: {
        propertyId: input.propertyId,
        authorName: input.authorName,
        rating: input.rating,
        comment: input.comment,
        userId: input.userId ?? null,
        ratingLocation: input.aspects?.location ?? null,
        ratingAmenities: input.aspects?.amenities ?? null,
        ratingConstruction: input.aspects?.construction ?? null,
        ratingValue: input.aspects?.value ?? null,
        ratingConnectivity: input.aspects?.connectivity ?? null,
        photos: input.photos ?? [],
      },
      select: selectReview,
    });
    return mapReview(row);
  },
};
