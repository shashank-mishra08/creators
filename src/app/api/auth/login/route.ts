import type { NextRequest } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { setSessionCookie } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/auth/login — { email, password } → verifies + sets session. */
export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, {
      name: "auth:login",
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    const body = (await parseJsonBody(req)) as {
      email?: string;
      password?: string;
    };
    const user = await authService.login(body.email ?? "", body.password ?? "");
    setSessionCookie(user.id);
    return json(user);
  } catch (err) {
    return handleError(err);
  }
}
