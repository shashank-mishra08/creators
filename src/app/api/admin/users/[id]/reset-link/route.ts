import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { adminUserService } from "@/lib/services/admin-user.service";
import { logAction } from "@/lib/services/audit.service";
import { handleError, json } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/users/[id]/reset-link — generate a fresh set-password link
 * for an existing admin user (Super Admin only). Emails it if configured and
 * returns the link so it can be shared manually.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await requirePermission("users", "edit");
    const origin = new URL(req.url).origin;
    const { user, resetUrl } = await adminUserService.createResetLink(params.id, origin);
    await logAction({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "user.reset_link",
      entity: "user",
      entityId: user.id,
      summary: `Generated password-reset link for ${user.email}`,
    });
    return json({ user, resetUrl });
  } catch (err) {
    return handleError(err);
  }
}
