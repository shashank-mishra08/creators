import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/roles";
import { logAction } from "@/lib/services/audit.service";
import { handleError, json, parseJsonBody } from "@/lib/api/http";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/properties/[id]/purge — permanent, irreversible delete.
 *
 * Cascades across every related table. Guarded twice: the property must already
 * be in Recently Deleted, and the exact name must be typed to confirm. Nothing
 * in the UI reaches this without the row having been soft-deleted first.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await requirePermission("trash", "purge");
    const body = (await parseJsonBody(req)) as { confirmName?: string };

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { name: true, deletedAt: true },
    });
    if (!property) throw new AppError("Property not found", 404);

    if (!property.deletedAt) {
      throw new AppError(
        "Delete the property first — only items in Recently Deleted can be purged.",
        400,
      );
    }

    if (body.confirmName?.trim() !== property.name.trim()) {
      throw new AppError(
        "Name confirmation does not match. Deletion cancelled.",
        400,
      );
    }

    // Cascade deletes handle all related records (as defined in schema).
    await prisma.property.delete({ where: { id: params.id } });
    await logAction({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "property.purge",
      entity: "property",
      entityId: params.id,
      summary: `Permanently deleted property "${property.name}"`,
    });
    return json({ success: true, deleted: property.name });
  } catch (err) {
    return handleError(err);
  }
}
