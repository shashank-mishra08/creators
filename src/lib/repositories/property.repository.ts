import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { PropertyFilters } from "@/lib/data-source";
import type {
  AmenityKey,
  Builder,
  City,
  PropertyKind,
  Possession,
  Property,
} from "@/lib/types";

/**
 * Property repository — the ONLY place that talks to Prisma for properties.
 * Maps the normalised v2 schema back to the frontend `Property` shape so the UI
 * contract is unchanged.
 */

const ALL_AMENITY_KEYS: AmenityKey[] = [
  "pool",
  "gym",
  "clubhouse",
  "security",
  "sports",
  "kidsArea",
  "coworking",
  "powerBackup",
];

/** DB amenity slug → frontend fixed AmenityKey. Slugs are produced by `norm()`
 *  (lowercase, alphanumeric only — no underscores), so keys must match that. */
const AMENITY_SLUG_TO_KEY: Record<string, AmenityKey> = {
  swimmingpool: "pool",
  pool: "pool",
  gym: "gym",
  clubhouse: "clubhouse",
  cctvsecurity: "security",
  security: "security",
  sportscourt: "sports",
  sports: "sports",
  kidsplayarea: "kidsArea",
  powerbackup: "powerBackup",
  coworking: "coworking",
  coworkingspace: "coworking",
};

const propertyInclude = {
  builder: true,
  pricing: true,
  location: true,
  investment: true,
  configurations: { orderBy: { sortOrder: "asc" } },
  amenities: true,
  media: { orderBy: { sortOrder: "asc" } },
  attributes: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.PropertyInclude;

type PropertyRow = Prisma.PropertyGetPayload<{ include: typeof propertyInclude }>;
type BuilderRow = Prisma.BuilderGetPayload<object>;

/* ---------------------------------- mappers ---------------------------------- */

export function mapBuilder(b: BuilderRow): Builder {
  return {
    id: b.id,
    name: b.name,
    rating: b.rating ?? 0,
    established: b.yearEstablished ?? 0,
    deliveredProjects: b.deliveredProjects ?? 0,
    logoColor: b.logoColor,
  };
}

function mapProperty(p: PropertyRow): Property {
  const amenities = Object.fromEntries(
    ALL_AMENITY_KEYS.map((k) => [k, false]),
  ) as Record<AmenityKey, boolean>;
  for (const a of p.amenities) {
    const key = AMENITY_SLUG_TO_KEY[a.key];
    if (key) amenities[key] = a.available;
  }

  // Full source amenity list (available first, then alphabetical) for display.
  const amenityList = p.amenities
    .map((a) => ({ key: a.key, label: a.label, available: a.available }))
    .sort(
      (x, y) =>
        Number(y.available) - Number(x.available) ||
        x.label.localeCompare(y.label),
    );

  // Real media only. When the client sheet has no image we return "" and the UI
  // renders a branded gradient placeholder rather than a misleading stock photo.
  const cover =
    p.media.find((m) => m.type === "cover")?.url ??
    p.media.find((m) => m.type === "gallery")?.url ??
    "";
  const gallery = p.media
    .filter((m) => m.type === "gallery")
    .map((m) => m.url);

  return {
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    description: p.description ?? "",
    builder: mapBuilder(p.builder),
    city: p.city as City,
    locality: p.locality,
    kind: p.kind as PropertyKind,
    configs: p.configsLabel,
    possession: p.possession as Possession,
    possessionDate: p.possessionDate,
    reraId: p.reraId ?? "",
    priceLakh: p.pricing?.startingPriceLakh ?? 0,
    pricePerSqFt: p.pricing?.pricePerSqFt ?? 0,
    priceRangeLabel: p.pricing?.priceRangeLabel ?? "",
    areaAcres: p.areaAcres,
    towers: p.towers,
    totalUnits: p.totalUnits ?? null,
    image: cover,
    gallery,
    gradient: [p.gradientFrom, p.gradientTo],
    amenities,
    amenityList,
    location: {
      // Source provides travel TIME (minutes); we surface it in the existing slots.
      metroKm: p.location?.metroMin ?? 0,
      hospitalKm: p.location?.hospitalMin ?? 0,
      schoolKm: p.location?.schoolMin ?? 0,
      airportKm: p.location?.expresswayMin ?? 0, // expressway in the 4th slot
      connectivityIndex: p.location?.connectivityIndex ?? 0,
    },
    investment: {
      appreciationPct: p.investment?.appreciationPct ?? 0,
      rentalYieldPct: p.investment?.rentalYieldPct ?? 0,
      demandIndex: p.investment?.demandIndex ?? 0,
    },
    floorPlans: p.configurations.map((c) => ({
      config: c.label,
      areaSqFt: c.areaSqFt,
      carpetAreaSqFt: c.carpetAreaSqft ?? null,
      balconyAreaSqFt: c.balconyAreaSqft ?? null,
      builtUpAreaSqFt: c.builtUpAreaSqft ?? null,
      priceLabel: c.priceLabel,
      image: c.floorPlanImage || "",
    })),
    highlights: p.attributes
      .filter((a) => a.category === "highlight")
      .map((a) => a.value),
  };
}

/* --------------------------------- queries ---------------------------------- */

function buildWhere(filters?: PropertyFilters): Prisma.PropertyWhereInput {
  if (!filters) return {};
  const where: Prisma.PropertyWhereInput = {};

  if (filters.city && filters.city !== "All") where.city = filters.city;
  if (filters.kind && filters.kind !== "All") where.kind = filters.kind;
  if (filters.possession && filters.possession !== "All")
    where.possession = filters.possession;
  if (filters.builder && filters.builder !== "All")
    where.builder = { name: filters.builder };
  if (filters.maxPriceLakh)
    where.pricing = { startingPriceLakh: { lte: filters.maxPriceLakh } };

  const q = filters.query?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { locality: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { configsLabel: { contains: q, mode: "insensitive" } },
      { builder: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  return where;
}

export const propertyRepository = {
  async findMany(filters?: PropertyFilters): Promise<Property[]> {
    const rows = await prisma.property.findMany({
      where: buildWhere(filters),
      include: propertyInclude,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapProperty);
  },

  async findById(id: string): Promise<Property | null> {
    const row = await prisma.property.findUnique({
      where: { id },
      include: propertyInclude,
    });
    return row ? mapProperty(row) : null;
  },

  async findByIds(ids: string[]): Promise<Property[]> {
    if (ids.length === 0) return [];
    const rows = await prisma.property.findMany({
      where: { id: { in: ids } },
      include: propertyInclude,
    });
    const map = new Map(rows.map((r) => [r.id, mapProperty(r)]));
    return ids.map((id) => map.get(id)).filter((p): p is Property => Boolean(p));
  },

  async findExcluding(excludeIds: string[], take = 3): Promise<Property[]> {
    const rows = await prisma.property.findMany({
      where: excludeIds.length ? { id: { notIn: excludeIds } } : {},
      include: propertyInclude,
      orderBy: { createdAt: "asc" },
      take,
    });
    return rows.map(mapProperty);
  },

  async distinctBuilderNames(): Promise<string[]> {
    const builders = await prisma.builder.findMany({
      where: { properties: { some: {} } },
      select: { name: true },
      orderBy: { name: "asc" },
    });
    return builders.map((b) => b.name);
  },
};
