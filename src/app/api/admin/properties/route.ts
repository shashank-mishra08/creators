import { requireAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { handleError, json } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/properties
 * Returns ALL properties (including hidden AND soft-deleted) with stats.
 * `deletedAt` tells the UI which bucket each row belongs in; stats count only
 * live rows so the dashboard totals don't include the trash.
 */
export async function GET() {
  try {
    await requireAdminSession();

    const properties = await prisma.property.findMany({
      include: {
        builder: { select: { name: true } },
        pricing: { select: { startingPriceLakh: true, priceRangeLabel: true } },
        media: { where: { type: "cover" }, take: 1, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const live = properties.filter((p) => !p.deletedAt);

    // Stats for dashboard — deleted properties are excluded from every count.
    const stats = {
      total: live.length,
      active: live.filter((p) => !p.hidden && p.possession !== "Under Construction").length,
      hidden: live.filter((p) => p.hidden).length,
      underConstruction: live.filter((p) => p.possession === "Under Construction" && !p.hidden).length,
      soldOut: live.filter((p) => p.possession === "Ready to Move" && !p.hidden).length,
      deleted: properties.length - live.length,
    };

    const list = properties.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      city: p.city,
      locality: p.locality,
      kind: p.kind,
      possession: p.possession,
      hidden: p.hidden,
      deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
      builderName: p.builder.name,
      priceRangeLabel: p.pricing?.priceRangeLabel ?? "",
      coverImage: p.media[0]?.url ?? "",
      createdAt: p.createdAt.toISOString(),
    }));

    return json({ stats, properties: list });
  } catch (err) {
    return handleError(err);
  }
}
