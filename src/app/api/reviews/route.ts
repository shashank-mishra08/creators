import type { NextRequest } from "next/server";
import { reviewService } from "@/lib/services/review.service";
import { getSessionUserId } from "@/lib/auth/session";
import { BadRequestError, UnauthorizedError } from "@/lib/errors";
import { handleError, json } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The collection route, distinct from `/api/reviews/[propertyId]`: this one is
 * scoped to the caller, not to a property.
 *
 * GET    /api/reviews      → the signed-in user's reviews + popularity ranking
 * DELETE /api/reviews?id=… → delete one of the caller's own reviews
 */
export async function GET() {
  try {
    const userId = getSessionUserId();
    if (!userId) throw new UnauthorizedError("Please sign in to see your reviews.");
    return json(await reviewService.listForUser(userId));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = getSessionUserId();
    if (!userId) throw new UnauthorizedError("Please sign in first.");

    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new BadRequestError("Missing review id");

    // Scoped to the session's user id, so one account can never delete
    // another's review by guessing an id.
    const removed = await reviewService.removeOwn(id, userId);
    if (!removed) throw new BadRequestError("That review is not yours to delete.");
    return json({ id });
  } catch (err) {
    return handleError(err);
  }
}
