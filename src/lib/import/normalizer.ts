import { prisma } from "@/lib/db/prisma";
import type { NormalizedProject } from "@/lib/import/validator";

/**
 * Persist a normalized project idempotently (keyed by `slug` = builder+project).
 * - Builders are deduped by name (upsert).
 * - Re-running replaces child rows (configs/towers/amenities/media/attributes
 *   and the 1:1 metric tables) but PRESERVES reviews & saved-comparison links.
 */
export async function upsertProject(
  p: NormalizedProject,
): Promise<"created" | "updated"> {
  return prisma.$transaction(async (tx) => {
    const builder = await tx.builder.upsert({
      where: { name: p.builder.name },
      update: {
        rating: p.builder.rating ?? undefined,
        yearEstablished: p.builder.yearEstablished ?? undefined,
        yearsInMarketRaw: p.builder.yearsInMarketRaw ?? undefined,
        deliveredProjects: p.builder.deliveredProjects ?? undefined,
        deliveredProjectsRaw: p.builder.deliveredProjectsRaw ?? undefined,
        ongoingProjects: p.builder.ongoingProjects ?? undefined,
      },
      create: {
        name: p.builder.name,
        rating: p.builder.rating,
        yearEstablished: p.builder.yearEstablished,
        yearsInMarketRaw: p.builder.yearsInMarketRaw,
        deliveredProjects: p.builder.deliveredProjects,
        deliveredProjectsRaw: p.builder.deliveredProjectsRaw,
        ongoingProjects: p.builder.ongoingProjects,
        logoColor: p.builder.logoColor,
      },
      select: { id: true },
    });

    const children = {
      pricing: { create: p.pricing },
      location: { create: p.location },
      investment: { create: p.investment },
      analysis: { create: p.analysis },
      parking: { create: p.parking },
      configurations: { create: p.configurations },
      towerUnits: { create: p.towers },
      amenities: { create: p.amenities },
      media: { create: p.media },
      attributes: { create: p.attributes },
    };

    const scalars = {
      name: p.property.name,
      subtitle: p.property.subtitle,
      builderId: builder.id,
      projectType: p.property.projectType,
      category: p.property.category,
      city: p.property.city,
      locality: p.property.locality,
      kind: p.property.kind,
      possession: p.property.possession,
      possessionDate: p.property.possessionDate,
      description: p.property.description,
      reraId: p.property.reraId,
      reraRegisteredAt: p.property.reraRegisteredAt,
      reraCompletionAt: p.property.reraCompletionAt,
      areaAcres: p.property.areaAcres,
      towers: p.property.towers,
      totalUnits: p.property.totalUnits,
      clubSizeSqft: p.property.clubSizeSqft,
      configsLabel: p.property.configsLabel,
      gradientFrom: p.property.gradientFrom,
      gradientTo: p.property.gradientTo,
    };

    const existing = await tx.property.findUnique({
      where: { slug: p.slug },
      select: { id: true },
    });

    if (existing) {
      const id = existing.id;
      // wipe rebuildable children (reviews & saved links are untouched)
      await Promise.all([
        tx.configuration.deleteMany({ where: { propertyId: id } }),
        tx.tower.deleteMany({ where: { propertyId: id } }),
        tx.amenity.deleteMany({ where: { propertyId: id } }),
        tx.propertyMedia.deleteMany({ where: { propertyId: id } }),
        tx.propertyAttribute.deleteMany({ where: { propertyId: id } }),
        tx.pricing.deleteMany({ where: { propertyId: id } }),
        tx.locationMetric.deleteMany({ where: { propertyId: id } }),
        tx.investmentMetric.deleteMany({ where: { propertyId: id } }),
        tx.internalAnalysis.deleteMany({ where: { propertyId: id } }),
        tx.parking.deleteMany({ where: { propertyId: id } }),
      ]);
      await tx.property.update({ where: { id }, data: { ...scalars, ...children } });
      return "updated";
    }

    await tx.property.create({ data: { slug: p.slug, ...scalars, ...children } });
    return "created";
  }, {
    // Neon (serverless) autosuspends and fronts connections with PgBouncer, so a
    // cold start can blow past Prisma's default 2s window to *acquire* a
    // connection and begin the transaction. Widen the budget for this one-off
    // import job (no effect on live app requests).
    maxWait: 20000, // wait up to 20s to start the transaction (absorbs cold start)
    timeout: 30000, // allow up to 30s once started (default 5s) — harmless headroom
  });
}
