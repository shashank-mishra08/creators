import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { logAction } from "@/lib/services/audit.service";
import { handleError, json } from "@/lib/api/http";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/properties/[id]/restore — bring a soft-deleted property back.
 *
 * Clearing `deletedAt` is all that is needed: soft delete never touched the
 * related pricing/media/configuration rows, so the project returns intact.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actorId = await requireAdminSession();

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { name: true, deletedAt: true },
    });
    if (!property) throw new AppError("Property not found", 404);
    if (!property.deletedAt) {
      throw new AppError("That property is not in Recently Deleted.", 400);
    }

    await prisma.property.update({
      where: { id: params.id },
      data: { deletedAt: null },
    });
    await logAction({
      actorId,
      action: "property.restore",
      entity: "property",
      entityId: params.id,
      summary: `Restored property "${property.name}"`,
    });
    return json({ success: true, restored: property.name });
  } catch (err) {
    return handleError(err);
  }
}
