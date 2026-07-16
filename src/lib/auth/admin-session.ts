import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";

/**
 * Admin-only session guard.
 * Call at the top of every admin API route handler.
 * Returns the userId if the request is from a verified admin.
 * Throws 401 (not signed in) or 403 (signed in but not admin).
 */
export async function requireAdminSession(): Promise<string> {
  const userId = getSessionUserId();
  if (!userId) {
    throw new AppError("Not authenticated. Please log in.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    throw new AppError("Access denied. Admin privileges required.", 403);
  }

  return userId;
}
