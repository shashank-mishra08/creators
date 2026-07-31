import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { logAction } from "@/lib/services/audit.service";
import { handleError, json, parseJsonBody } from "@/lib/api/http";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/properties/[id] — full property data for edit form */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission("properties", "view");
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        builder: true,
        pricing: true,
        location: true,
        investment: true,
        configurations: { orderBy: { sortOrder: "asc" } },
        towerUnits: { orderBy: { sortOrder: "asc" } },
        amenities: { orderBy: { label: "asc" } },
        media: { orderBy: { sortOrder: "asc" } },
        attributes: { orderBy: { sortOrder: "asc" } },
        parking: true,
      },
    });
    if (!property) throw new AppError("Property not found", 404);
    return json(property);
  } catch (err) {
    return handleError(err);
  }
}

/** PATCH /api/admin/properties/[id] — update top-level property fields + related records */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission("properties", "edit");
    const body = (await parseJsonBody(req)) as Record<string, unknown>;

    const {
      name, subtitle, city, locality, kind, possession, possessionDate,
      reraId, description, areaAcres, towers, totalUnits, configsLabel,
      gradientFrom, gradientTo,
      // nested
      pricing, location, investment, configurations, amenities, media, highlights,
    } = body as {
      name?: string; subtitle?: string; city?: string; locality?: string;
      kind?: string; possession?: string; possessionDate?: string; reraId?: string;
      description?: string; areaAcres?: number; towers?: number; totalUnits?: number;
      configsLabel?: string; gradientFrom?: string; gradientTo?: string;
      pricing?: Record<string, unknown>; location?: Record<string, unknown>;
      investment?: Record<string, unknown>;
      configurations?: Array<Record<string, unknown>>;
      amenities?: Array<{ key: string; label: string; available: boolean; note?: string }>;
      media?: Array<{ type: string; url: string; alt?: string; sortOrder?: number }>;
      highlights?: string[];
    };

    // Update main property record
    await prisma.property.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(subtitle !== undefined && { subtitle }),
        ...(city !== undefined && { city }),
        ...(locality !== undefined && { locality }),
        ...(kind !== undefined && { kind }),
        ...(possession !== undefined && { possession }),
        ...(possessionDate !== undefined && { possessionDate }),
        ...(reraId !== undefined && { reraId }),
        ...(description !== undefined && { description }),
        ...(areaAcres !== undefined && { areaAcres }),
        ...(towers !== undefined && { towers }),
        ...(totalUnits !== undefined && { totalUnits }),
        ...(configsLabel !== undefined && { configsLabel }),
        ...(gradientFrom !== undefined && { gradientFrom }),
        ...(gradientTo !== undefined && { gradientTo }),
      },
    });

    // Update pricing (upsert)
    if (pricing) {
      await prisma.pricing.upsert({
        where: { propertyId: params.id },
        create: { propertyId: params.id, ...pricing as object },
        update: pricing as object,
      });
    }

    // Update location (upsert)
    if (location) {
      await prisma.locationMetric.upsert({
        where: { propertyId: params.id },
        create: { propertyId: params.id, ...location as object },
        update: location as object,
      });
    }

    // Update investment (upsert)
    if (investment) {
      await prisma.investmentMetric.upsert({
        where: { propertyId: params.id },
        create: { propertyId: params.id, ...investment as object },
        update: investment as object,
      });
    }

    // Replace configurations entirely
    if (configurations) {
      await prisma.configuration.deleteMany({ where: { propertyId: params.id } });
      await prisma.configuration.createMany({
        data: configurations.map((c, i) => ({
          propertyId: params.id,
          label: c.label as string,
          areaSqFt: (c.areaSqFt as number) ?? 0,
          carpetAreaSqft: c.carpetAreaSqft as number | null,
          balconyAreaSqft: c.balconyAreaSqft as number | null,
          builtUpAreaSqft: c.builtUpAreaSqft as number | null,
          priceLabel: (c.priceLabel as string) ?? "",
          floorPlanImage: (c.floorPlanImage as string) ?? "",
          sortOrder: i,
        })),
      });
    }

    // Replace amenities entirely
    if (amenities) {
      await prisma.amenity.deleteMany({ where: { propertyId: params.id } });
      await prisma.amenity.createMany({
        data: amenities.map((a) => ({
          propertyId: params.id,
          key: a.key,
          label: a.label,
          available: a.available,
          note: a.note ?? null,
        })),
      });
    }

    // Replace media entirely
    if (media) {
      await prisma.propertyMedia.deleteMany({ where: { propertyId: params.id } });
      await prisma.propertyMedia.createMany({
        data: media.map((m, i) => ({
          propertyId: params.id,
          type: m.type,
          url: m.url,
          alt: m.alt ?? null,
          sortOrder: m.sortOrder ?? i,
        })),
      });
    }

    // Replace highlights
    if (highlights) {
      await prisma.propertyAttribute.deleteMany({
        where: { propertyId: params.id, category: "highlight" },
      });
      await prisma.propertyAttribute.createMany({
        data: highlights.map((h, i) => ({
          propertyId: params.id,
          category: "highlight",
          key: `highlight_${i}`,
          value: h,
          sortOrder: i,
        })),
      });
    }

    return json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}

/**
 * DELETE /api/admin/properties/[id] — move to Recently Deleted.
 *
 * Soft delete: a hard `property.delete()` cascades across pricing,
 * configurations, media, amenities, towers, reviews and attributes, and there
 * is no way back — the audit log stores a summary string, not the data. Stamping
 * `deletedAt` keeps every related row intact so a restore is a one-field update.
 * Purging for real lives at /[id]/purge, behind its own name confirmation.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requirePermission("properties", "delete");
    const body = (await parseJsonBody(req)) as { confirmName?: string };

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { name: true },
    });
    if (!property) throw new AppError("Property not found", 404);

    if (body.confirmName?.trim() !== property.name.trim()) {
      throw new AppError(
        "Name confirmation does not match. Deletion cancelled.",
        400
      );
    }

    await prisma.property.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    await logAction({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "property.delete",
      entity: "property",
      entityId: params.id,
      summary: `Moved property "${property.name}" to Recently Deleted`,
    });
    return json({ success: true, deleted: property.name });
  } catch (err) {
    return handleError(err);
  }
}
