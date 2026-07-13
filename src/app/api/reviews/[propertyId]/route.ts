import type { NextRequest } from "next/server";
import { reviewService } from "@/lib/services/review.service";
import { authService } from "@/lib/services/auth.service";
import { submitReviewSchema } from "@/lib/validation/schemas";
import { getSessionUserId } from "@/lib/auth/session";
import { UnauthorizedError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/reviews/:propertyId — reviews + average rating for a property. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { propertyId: string } },
) {
  try {
    return json(await reviewService.listForProperty(params.propertyId));
  } catch (err) {
    return handleError(err);
  }
}

/** POST /api/reviews/:propertyId — add a review as the signed-in user. */
export async function POST(
  req: NextRequest,
  { params }: { params: { propertyId: string } },
) {
  try {
    enforceRateLimit(req, {
      name: "reviews:create",
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    const userId = getSessionUserId();
    if (!userId) throw new UnauthorizedError("Please sign in to write a review.");
    const user = await authService.me(userId);
    if (!user) throw new UnauthorizedError("Please sign in to write a review.");

    // Identity comes from the session — the client cannot spoof authorName/userId.
    const { rating, comment } = submitReviewSchema.parse(await parseJsonBody(req));
    const review = await reviewService.create(params.propertyId, {
      authorName: user.name,
      rating,
      comment,
      userId,
    });
    return json(review, 201);
  } catch (err) {
    return handleError(err);
  }
}
