import type { NextRequest } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { getSessionUserId } from "@/lib/auth/session";
import { UnauthorizedError } from "@/lib/errors";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/auth/saved — { propertyId } toggles it in the user's saved list. */
export async function POST(req: NextRequest) {
  try {
    const userId = getSessionUserId();
    if (!userId) throw new UnauthorizedError("Please sign in to save properties.");
    const body = (await parseJsonBody(req)) as { propertyId?: string };
    if (!body.propertyId) throw new UnauthorizedError("propertyId is required.");
    const savedPropertyIds = await authService.toggleSaved(userId, body.propertyId);
    return json({ savedPropertyIds });
  } catch (err) {
    return handleError(err);
  }
}
