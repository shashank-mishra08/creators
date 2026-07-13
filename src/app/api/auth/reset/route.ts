import type { NextRequest } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { setSessionCookie } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/auth/reset — { token, password } → sets new password + signs in. */
export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, {
      name: "auth:reset",
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    const body = (await parseJsonBody(req)) as {
      token?: string;
      password?: string;
    };
    const user = await authService.resetPassword(
      body.token ?? "",
      body.password ?? "",
    );
    setSessionCookie(user.id);
    return json(user);
  } catch (err) {
    return handleError(err);
  }
}
