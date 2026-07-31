import { requirePermission } from "@/lib/auth/roles";
import { settingsService, type SettingsPatch } from "@/lib/services/settings.service";
import { logAction } from "@/lib/services/audit.service";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/settings — read current settings (any admin). */
export async function GET() {
  try {
    await requirePermission("settings", "view");
    const settings = await settingsService.get();
    return json({ settings });
  } catch (err) {
    return handleError(err);
  }
}

/** PATCH /api/admin/settings — update settings (Super Admin only). */
export async function PATCH(req: Request) {
  try {
    const actor = await requirePermission("settings", "edit");
    const body = (await parseJsonBody(req as Parameters<typeof parseJsonBody>[0])) as SettingsPatch;
    const settings = await settingsService.update(body);
    const changed = Object.keys(body).join(", ");
    await logAction({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "settings.update",
      entity: "settings",
      summary: changed ? `Updated: ${changed}` : "Updated settings",
    });
    return json({ settings });
  } catch (err) {
    return handleError(err);
  }
}
