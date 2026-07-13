import { prisma } from "@/lib/db/prisma";
import { mapBuilder } from "@/lib/repositories/property.repository";
import type { Builder } from "@/lib/types";

export interface BuilderWithStats extends Builder {
  description: string | null;
  propertyCount: number;
}

export const builderRepository = {
  async findAll(): Promise<BuilderWithStats[]> {
    const rows = await prisma.builder.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { properties: true } } },
    });
    return rows.map((b) => ({
      ...mapBuilder(b),
      description: b.description,
      propertyCount: b._count.properties,
    }));
  },

  async findById(id: string): Promise<BuilderWithStats | null> {
    const b = await prisma.builder.findUnique({
      where: { id },
      include: { _count: { select: { properties: true } } },
    });
    if (!b) return null;
    return {
      ...mapBuilder(b),
      description: b.description,
      propertyCount: b._count.properties,
    };
  },
};
