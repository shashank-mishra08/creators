import { prisma } from "@/lib/db/prisma";
import type { SavedComparison } from "@/lib/types";

type SavedRow = {
  id: string;
  name: string | null;
  createdAt: Date;
  items: { propertyId: string }[];
};

function mapSaved(s: SavedRow): SavedComparison {
  return {
    id: s.id,
    name: s.name,
    propertyIds: s.items.map((i) => i.propertyId),
    createdAt: s.createdAt.toISOString(),
  };
}

export const savedComparisonRepository = {
  async findByUser(userId: string): Promise<SavedComparison[]> {
    const rows = await prisma.savedComparison.findMany({
      where: { userId },
      include: { items: { select: { propertyId: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapSaved);
  },

  async create(
    userId: string,
    propertyIds: string[],
    name?: string | null,
  ): Promise<SavedComparison> {
    const row = await prisma.savedComparison.create({
      data: {
        userId,
        name: name ?? null,
        items: { create: propertyIds.map((propertyId) => ({ propertyId })) },
      },
      include: { items: { select: { propertyId: true } } },
    });
    return mapSaved(row);
  },

  /** Deletes a saved comparison, scoped to its owner (returns false if not theirs). */
  async deleteOwned(id: string, userId: string): Promise<boolean> {
    const result = await prisma.savedComparison.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  },
};
