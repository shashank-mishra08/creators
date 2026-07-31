import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { adminUserService } from "@/lib/services/admin-user.service";
import { logAction } from "@/lib/services/audit.service";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH /api/admin/users/[id] — change role and/or active status (Super Admin only). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await requirePermission("users", "edit");
    const body = (await parseJsonBody(req)) as { role?: string; isActive?: boolean };
    const user = await adminUserService.update(params.id, actor.id, {
      role: body.role,
      isActive: body.isActive,
    });
    await logAction({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "user.update",
      entity: "user",
      entityId: user.id,
      summary: `Updated ${user.email} — role ${user.role}, ${user.isActive ? "active" : "deactivated"}`,
    });
    return json({ user });
  } catch (err) {
    return handleError(err);
  }
}
