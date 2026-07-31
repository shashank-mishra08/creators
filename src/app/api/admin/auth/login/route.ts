import { NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/admin/auth/login — admin login */
export async function POST(req: Request) {
  try {
    const body = await parseJsonBody(req as Parameters<typeof parseJsonBody>[0]);
    const { email, password } = body as { email: string; password: string };

    const user = await authService.login(email, password);

    // Verify admin status
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true, isActive: true },
    });
    if (!dbUser?.isAdmin) {
      return NextResponse.json(
        { error: "Access denied. This account does not have admin privileges." },
        { status: 403 }
      );
    }
    if (dbUser.isActive === false) {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact an administrator." },
        { status: 403 }
      );
    }

    // Record last login (best-effort — never block sign-in on this).
    await prisma.user
      .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      .catch(() => {});

    setSessionCookie(user.id);
    return json({ user });
  } catch (err) {
    return handleError(err);
  }
}
