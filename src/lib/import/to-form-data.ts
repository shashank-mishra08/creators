import type { PropertyFormData } from "@/components/admin/property-form";
import type { NormalizedProject } from "@/lib/import/validator";

/** number|null → string ("" for empty) — the form's array fields are string-based. */
const s = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));
/** number|null → number|undefined — the form's scalar number fields are optional. */
const n = (v: number | null | undefined) => (v === null || v === undefined ? undefined : v);

/**
 * Convert a validated import project into the shape the existing admin
 * PropertyForm consumes, so an uploaded sheet can prefill that form for review
 * and editing. Mirrors the DB→form mapping in the property edit page.
 * Fields the form does not expose (per-tower detail, parking, builder meta,
 * internal analysis) are intentionally omitted — they are not editable there.
 */
export function normalizedToFormData(p: NormalizedProject): PropertyFormData {
  return {
    name: p.property.name,
    builderName: p.builder.name,
    subtitle: p.property.subtitle,
    city: p.property.city,
    locality: p.property.locality,
    kind: p.property.kind,
    possession: p.property.possession,
    possessionDate: p.property.possessionDate,
    reraId: p.property.reraId ?? "",
    description: p.property.description ?? "",
    areaAcres: p.property.areaAcres,
    towers: p.property.towers,
    totalUnits: n(p.property.totalUnits),

    startingPriceLakh: n(p.pricing.startingPriceLakh),
    maxPriceLakh: n(p.pricing.maxPriceLakh),
    pricePerSqFt: n(p.pricing.pricePerSqFt),
    bookingAmount: n(p.pricing.bookingAmount),
    maintenancePerSqft: n(p.pricing.maintenancePerSqft),
    priceRangeLabel: p.pricing.priceRangeLabel,

    configs: p.configurations.map((c) => ({
      label: c.label,
      areaSqFt: s(c.areaSqFt),
      carpetAreaSqft: s(c.carpetAreaSqft),
      balconyAreaSqft: s(c.balconyAreaSqft),
      builtUpAreaSqft: s(c.builtUpAreaSqft),
      priceLabel: c.priceLabel,
      floorPlanImage: c.floorPlanImage,
    })),

    metroMin: n(p.location.metroMin),
    schoolMin: n(p.location.schoolMin),
    hospitalMin: n(p.location.hospitalMin),
    expresswayMin: n(p.location.expresswayMin),
    mapsUrl: p.location.mapsUrl ?? "",

    amenities: p.amenities.map((a) => ({
      key: a.key,
      label: a.label,
      available: a.available,
      note: a.note ?? "",
    })),

    appreciationPct: n(p.investment.appreciationPct),
    rentalYieldPct: n(p.investment.rentalYieldPct),
    demandIndex: n(p.investment.demandIndex),
    idealFor: p.investment.idealFor ?? "Both",
    investorFriendly: p.investment.investorFriendly ?? true,

    coverImage: p.media.find((m) => m.type === "cover")?.url ?? "",
    layoutImage: p.media.find((m) => m.type === "layout")?.url ?? "",
    galleryImages: p.media.filter((m) => m.type === "gallery").map((m) => m.url),
    brochureUrl: p.media.find((m) => m.type === "brochure")?.url ?? "",
    videoUrl: p.media.find((m) => m.type === "video")?.url ?? "",

    highlights: p.attributes.filter((a) => a.category === "highlight").map((a) => a.value),
  };
}
