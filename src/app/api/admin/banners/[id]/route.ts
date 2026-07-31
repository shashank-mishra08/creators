import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { bannerService } from "@/lib/services/banner.service";
import { logAction } from "@/lib/services/audit.service";
import { bannerSchema } from "@/lib/validation/schemas";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH /api/admin/banners/[id] — update a banner. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await requirePermission("banners", "edit");
    const input = bannerSchema.parse(await parseJsonBody(req));
    const banner = await bannerService.update(params.id, input);
    await logAction({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "banner.update",
      entity: "banner",
      entityId: banner.id,
      summary: `Updated banner "${banner.title || banner.imageUrl}"`,
    });
    return json(banner);
  } catch (err) {
    return handleError(err);
  }
}

/** DELETE /api/admin/banners/[id] — remove a banner. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await requirePermission("banners", "delete");
    await bannerService.remove(params.id);
    await logAction({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "banner.delete",
      entity: "banner",
      entityId: params.id,
      summary: "Deleted a banner",
    });
    return json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
