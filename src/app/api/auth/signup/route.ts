import type { NextRequest } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { setSessionCookie } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/auth/signup — { name, email, phone, password } → account + session. */
export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, {
      name: "auth:signup",
      limit: 6,
      windowMs: 60 * 60 * 1000,
    });
    const body = (await parseJsonBody(req)) as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };
    const user = await authService.signup(
      body.name ?? "",
      body.email ?? "",
      body.phone ?? "",
      body.password ?? "",
    );
    setSessionCookie(user.id);
    return json(user, 201);
  } catch (err) {
    return handleError(err);
  }
}
