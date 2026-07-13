import { authService } from "@/lib/services/auth.service";
import { getSessionUserId } from "@/lib/auth/session";
import { handleError, json } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/auth/me — the currently signed-in user (or null). */
export async function GET() {
  try {
    const userId = getSessionUserId();
    if (!userId) return json(null);
    return json(await authService.me(userId));
  } catch (err) {
    return handleError(err);
  }
}
