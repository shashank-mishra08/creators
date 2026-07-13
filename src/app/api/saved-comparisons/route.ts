import type { NextRequest } from "next/server";
import { savedComparisonService } from "@/lib/services/saved-comparison.service";
import {
  createSavedComparisonSchema,
  deleteSavedComparisonSchema,
} from "@/lib/validation/schemas";
import { getSessionUserId } from "@/lib/auth/session";
import { UnauthorizedError } from "@/lib/errors";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/saved-comparisons — the signed-in user's saved comparisons. */
export async function GET() {
  try {
    const userId = getSessionUserId();
    if (!userId) throw new UnauthorizedError("Please sign in.");
    return json(await savedComparisonService.listForUser(userId));
  } catch (err) {
    return handleError(err);
  }
}

/** POST /api/saved-comparisons — { propertyIds[], name? } for the current user. */
export async function POST(req: NextRequest) {
  try {
    const userId = getSessionUserId();
    if (!userId) throw new UnauthorizedError("Please sign in.");
    const { propertyIds, name } = createSavedComparisonSchema.parse(
      await parseJsonBody(req),
    );
    const saved = await savedComparisonService.create(userId, propertyIds, name);
    return json(saved, 201);
  } catch (err) {
    return handleError(err);
  }
}

/** DELETE /api/saved-comparisons — { id } (owner-scoped to the current user). */
export async function DELETE(req: NextRequest) {
  try {
    const userId = getSessionUserId();
    if (!userId) throw new UnauthorizedError("Please sign in.");
    const { id } = deleteSavedComparisonSchema.parse(await parseJsonBody(req));
    await savedComparisonService.delete(id, userId);
    return json({ id, deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
