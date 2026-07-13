import { clearSessionCookie } from "@/lib/auth/session";
import { handleError, json } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/auth/logout — clears the session cookie. */
export async function POST() {
  try {
    clearSessionCookie();
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
