import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { handleError, json, parseJsonBody } from "@/lib/api/http";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/admin/properties/create — create a full new property */
export async function POST(req: NextRequest) {
  try {
    await requirePermission("properties", "create");
    const body = (await parseJsonBody(req)) as {
      builderName: string;
      name: string; subtitle?: string; city: string; locality: string;
      kind: string; possession: string; possessionDate?: string;
      reraId?: string; description?: string; areaAcres?: number;
      towers?: number; totalUnits?: number; configsLabel?: string;
      pricing?: Record<string, unknown>;
      location?: Record<string, unknown>;
      investment?: Record<string, unknown>;
      configurations?: Array<{
        label: string; areaSqFt?: number; carpetAreaSqft?: number;
        balconyAreaSqft?: number; builtUpAreaSqft?: number;
        priceLabel?: string; floorPlanImage?: string;
      }>;
      amenities?: Array<{ key: string; label: string; available: boolean; note?: string }>;
      media?: Array<{ type: string; url: string; alt?: string; sortOrder?: number }>;
      highlights?: string[];
    };

    if (!body.name || !body.city || !body.locality || !body.kind || !body.possession) {
      throw new AppError("name, city, locality, kind, and possession are required", 400);
    }

    // Find or create builder
    let builder = await prisma.builder.findFirst({
      where: { name: { equals: body.builderName, mode: "insensitive" } },
    });
    if (!builder) {
      builder = await prisma.builder.create({
        data: { name: body.builderName },
      });
    }

    // Create slug (builder + property name, slugified)
    const slugBase = `${builder.name}-${body.name}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Ensure slug is unique
    const existing = await prisma.property.findFirst({ where: { slug: { startsWith: slugBase } } });
    const slug = existing ? `${slugBase}-${Date.now()}` : slugBase;

    // Create the property with all related records in one transaction
    const property = await prisma.property.create({
      data: {
        slug,
        name: body.name,
        subtitle: body.subtitle ?? "",
        builderId: builder.id,
        city: body.city,
        locality: body.locality,
        kind: body.kind,
        possession: body.possession,
        possessionDate: body.possessionDate ?? "",
        reraId: body.reraId ?? null,
        description: body.description ?? null,
        areaAcres: body.areaAcres ?? 0,
        towers: body.towers ?? 0,
        totalUnits: body.totalUnits ?? null,
        configsLabel: body.configsLabel ?? "",

        pricing: body.pricing ? { create: body.pricing as object } : undefined,
        location: body.location ? { create: body.location as object } : undefined,
        investment: body.investment ? { create: body.investment as object } : undefined,

        configurations: body.configurations ? {
          create: body.configurations.map((c, i) => ({
            label: c.label,
            areaSqFt: c.areaSqFt ?? 0,
            carpetAreaSqft: c.carpetAreaSqft ?? null,
            balconyAreaSqft: c.balconyAreaSqft ?? null,
            builtUpAreaSqft: c.builtUpAreaSqft ?? null,
            priceLabel: c.priceLabel ?? "",
            floorPlanImage: c.floorPlanImage ?? "",
            sortOrder: i,
          })),
        } : undefined,

        amenities: body.amenities ? {
          create: body.amenities.map((a) => ({
            key: a.key,
            label: a.label,
            available: a.available,
            note: a.note ?? null,
          })),
        } : undefined,

        media: body.media ? {
          create: body.media.map((m, i) => ({
            type: m.type,
            url: m.url,
            alt: m.alt ?? null,
            sortOrder: m.sortOrder ?? i,
          })),
        } : undefined,

        attributes: body.highlights ? {
          create: body.highlights.map((h, i) => ({
            category: "highlight",
            key: `highlight_${i}`,
            value: h,
            sortOrder: i,
          })),
        } : undefined,
      },
    });

    return json({ success: true, id: property.id, slug: property.slug }, 201);
  } catch (err) {
    return handleError(err);
  }
}
