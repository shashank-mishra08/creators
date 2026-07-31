import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { logAction } from "@/lib/services/audit.service";
import { handleError, json, parseJsonBody } from "@/lib/api/http";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH /api/admin/properties/[id]/visibility — toggle hidden field */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requirePermission("properties", "edit");
    const body = (await parseJsonBody(req)) as { hidden: boolean };

    if (typeof body.hidden !== "boolean") {
      throw new AppError("'hidden' must be a boolean", 400);
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: { hidden: body.hidden },
      select: { id: true, name: true, hidden: true },
    });

    await logAction({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: updated.hidden ? "property.hide" : "property.show",
      entity: "property",
      entityId: updated.id,
      summary: `${updated.hidden ? "Hid" : "Unhid"} property "${updated.name}"`,
    });

    return json(updated);
  } catch (err) {
    return handleError(err);
  }
}
