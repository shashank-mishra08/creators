import type { City, Possession, Property, PropertyKind } from "@/lib/types";

/**
 * Data-layer seam.
 *
 * The UI talks ONLY to this `PropertyDataSource` interface. It is now backed by
 * PostgreSQL via the service/repository layer (`PrismaDataSource`). Swapping the
 * backend later (e.g. a remote API) means implementing this same interface — no
 * UI changes required.
 *
 *   UI ──► PropertyDataSource ──► propertyService ──► repository ──► Prisma/PG
 *
 * NOTE: this module is server-only (it reaches the DB). Client components must
 * go through the API routes under `/src/app/api`, not import this directly.
 */

export interface PropertyFilters {
  query?: string;
  city?: City | "All";
  kind?: PropertyKind | "All";
  builder?: string | "All";
  possession?: Possession | "All";
  /** Max starting price in INR lakhs. */
  maxPriceLakh?: number;
}

export interface PropertyDataSource {
  list(filters?: PropertyFilters): Promise<Property[]>;
  get(id: string): Promise<Property | undefined>;
  getMany(ids: string[]): Promise<Property[]>;
}

class PrismaDataSource implements PropertyDataSource {
  async list(filters?: PropertyFilters): Promise<Property[]> {
    const { propertyService } = await import("@/lib/services/property.service");
    return propertyService.list(filters);
  }
  async get(id: string): Promise<Property | undefined> {
    const { propertyService } = await import("@/lib/services/property.service");
    return (await propertyService.getById(id)) ?? undefined;
  }
  async getMany(ids: string[]): Promise<Property[]> {
    const { propertyService } = await import("@/lib/services/property.service");
    return propertyService.getByIds(ids);
  }
}

/**
 * Pure, synchronous filter helper (kept for any in-memory filtering needs).
 */
export function applyFilters(
  list: Property[],
  filters?: PropertyFilters,
): Property[] {
  if (!filters) return list;
  const q = filters.query?.trim().toLowerCase();
  return list.filter((p) => {
    if (q) {
      const hay =
        `${p.name} ${p.builder.name} ${p.locality} ${p.city} ${p.configs}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.city && filters.city !== "All" && p.city !== filters.city)
      return false;
    if (filters.kind && filters.kind !== "All" && p.kind !== filters.kind)
      return false;
    if (
      filters.builder &&
      filters.builder !== "All" &&
      p.builder.name !== filters.builder
    )
      return false;
    if (
      filters.possession &&
      filters.possession !== "All" &&
      p.possession !== filters.possession
    )
      return false;
    if (filters.maxPriceLakh && p.priceLakh > filters.maxPriceLakh) return false;
    return true;
  });
}

let instance: PropertyDataSource | null = null;

/** Returns the active (PostgreSQL-backed) data source. */
export function getDataSource(): PropertyDataSource {
  if (!instance) instance = new PrismaDataSource();
  return instance;
}

// Back-compat re-exports (constants live in `@/lib/constants`).
export { CITIES, KINDS, POSSESSIONS } from "@/lib/constants";
