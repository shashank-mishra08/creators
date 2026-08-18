import { z } from "zod";
import { REVIEW_COMMENT_MAX, REVIEW_PHOTO_MAX } from "@/lib/constants";
import { REVIEW_PHOTO_URL_PREFIX } from "@/lib/storage/review-photo-store";

/** Query params for listing properties (all optional). */
export const propertyFiltersSchema = z.object({
  query: z.string().trim().min(1).optional(),
  city: z.string().optional(),
  kind: z.string().optional(),
  builder: z.string().optional(),
  possession: z.string().optional(),
  maxPriceLakh: z.coerce.number().positive().optional(),
});
export type PropertyFiltersInput = z.infer<typeof propertyFiltersSchema>;

/** Property ids are stored as UUIDs but treated as opaque strings by the API. */
const idList = z
  .array(z.string().min(1))
  .min(2, "Select at least 2 properties to compare")
  .max(4, "You can compare up to 4 properties");

export const compareSchema = z.object({ ids: idList });

/** Optional 1–5 aspect score. `null` means "reviewer skipped it". */
const aspectScore = z.number().int().min(1).max(5).nullable().optional();

/**
 * A stored photo URL. Only paths this app produced (the local-disk fallback's
 * `/api/review-photos/...`) or absolute https URLs (Cloudinary) are accepted —
 * the value ends up in an `<img src>`, so anything else (`javascript:`, `data:`,
 * an off-site tracker) must never reach the database.
 */
const photoUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v.startsWith(REVIEW_PHOTO_URL_PREFIX) || v.startsWith("https://"),
    "Unsupported photo URL",
  );

/** Client-supplied review body. `authorName`/`userId` are set server-side from
 *  the authenticated session, never trusted from the request. */
export const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(REVIEW_COMMENT_MAX),
  aspects: z
    .object({
      location: aspectScore,
      amenities: aspectScore,
      construction: aspectScore,
      value: aspectScore,
      connectivity: aspectScore,
    })
    .optional(),
  photos: z.array(photoUrl).max(REVIEW_PHOTO_MAX).optional(),
});
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

/** Full record the service persists (assembled from the session + body). */
export interface CreateReviewInput {
  authorName: string;
  rating: number;
  comment: string;
  userId?: string;
  aspects?: SubmitReviewInput["aspects"];
  photos?: string[];
}

/** `userId` is derived from the session, so it is NOT accepted from the body. */
export const createSavedComparisonSchema = z.object({
  propertyIds: idList,
  name: z.string().trim().max(120).optional(),
});
export type CreateSavedComparisonInput = z.infer<
  typeof createSavedComparisonSchema
>;

export const deleteSavedComparisonSchema = z.object({
  id: z.string().uuid(),
});

/** Admin banner payload. Dates arrive as ISO strings or empty/null. */
const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || !Number.isNaN(Date.parse(v)), {
    message: "Invalid date",
  });

export const bannerSchema = z.object({
  title: z.string().trim().max(120).default(""),
  subtitle: z.string().trim().max(240).default(""),
  mediaType: z.enum(["image", "video"]).default("image"),
  imageUrl: z.string().trim().default(""),
  imageUrlMobile: z.string().trim().default(""),
  videoUrl: z.string().trim().default(""),
  linkUrl: z.string().trim().max(500).default(""),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
  startsAt: optionalDate,
  endsAt: optionalDate,
})
  // Whichever media type is chosen, that URL is the one that must be present.
  .refine((b) => (b.mediaType === "video" ? b.videoUrl : b.imageUrl), {
    message: "Add the media for this banner before saving",
    path: ["imageUrl"],
  });
