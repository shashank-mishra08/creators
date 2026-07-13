import type { NextRequest } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/auth/forgot — { email } → emails a reset link (generic response). */
export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, {
      name: "auth:forgot",
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    const body = (await parseJsonBody(req)) as { email?: string };
    const origin = process.env.APP_URL || req.nextUrl.origin;
    await authService.requestPasswordReset(body.email ?? "", origin);
    // Always the same response — never reveal whether an account exists.
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
