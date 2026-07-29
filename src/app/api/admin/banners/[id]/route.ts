import type { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-session";
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
    const actorId = await requireAdminSession();
    const input = bannerSchema.parse(await parseJsonBody(req));
    const banner = await bannerService.update(params.id, input);
    await logAction({
      actorId,
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
    const actorId = await requireAdminSession();
    await bannerService.remove(params.id);
    await logAction({
      actorId,
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
