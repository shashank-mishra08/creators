import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { bannerService } from "@/lib/services/banner.service";
import { logAction } from "@/lib/services/audit.service";
import { bannerSchema } from "@/lib/validation/schemas";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/banners — every banner, including inactive/expired. */
export async function GET() {
  try {
    await requirePermission("banners", "view");
    return json(await bannerService.all());
  } catch (err) {
    return handleError(err);
  }
}

/** POST /api/admin/banners — create a banner. */
export async function POST(req: NextRequest) {
  try {
    const actor = await requirePermission("banners", "create");
    const input = bannerSchema.parse(await parseJsonBody(req));
    const banner = await bannerService.create(input);
    await logAction({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "banner.create",
      entity: "banner",
      entityId: banner.id,
      summary: `Created banner "${banner.title || banner.imageUrl}"`,
    });
    return json(banner, 201);
  } catch (err) {
    return handleError(err);
  }
}
