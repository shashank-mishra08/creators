import type { ParsedProject } from "@/lib/import/parser";
import * as C from "@/lib/import/cleaners";
import { formatPriceLakh } from "@/lib/utils";

/**
 * Corrections for known builder-name typos in the source client sheets (data
 * entry errors). Keyed by the exact raw cell value so re-imports self-heal.
 */
const BUILDER_NAME_FIXES: Record<string, string> = {
  "Purvanchal ProjProjectcts": "Purvanchal Projects",
  "Purvanchal": "Purvanchal Projects",
};

/**
 * Canonical display name per builder, matched case-insensitively so variants
 * like "ELDECO"/"Eldeco" collapse to a single builder (dedup). Acronym builders
 * (SKA, CRC, VVIP) are left as-is by omission.
 */
const BUILDER_CANONICAL: Record<string, string> = {
  ELDECO: "Eldeco",
  GAURS: "Gaurs",
  ARIHANT: "Arihant",
  IMPERIA: "Imperia",
};

/**
 * Canonicalise city/location to the specific locations used by the source
 * folders (exact-match on the raw cell value). Fixes the "Yamuna Expessway"
 * typo, and resolves generic "Greater Noida" to "Greater Noida East" — every
 * such project in the source data lives under the Greater Noida East folder;
 * West projects already carry "Greater Noida West" and are untouched.
 */
const CITY_FIXES: Record<string, string> = {
  "Yamuna Expessway": "Yamuna Expressway",
  "Greater Noida": "Greater Noida East",
};

export interface Issue {
  level: "error" | "warning";
  field: string;
  message: string;
}

export interface NormalizedProject {
  slug: string;
  sourceFile: string;
  builder: {
    name: string;
    rating: number | null;
    yearEstablished: number | null;
    yearsInMarketRaw: string | null;
    deliveredProjects: number | null;
    deliveredProjectsRaw: string | null;
    ongoingProjects: number | null;
    logoColor: string;
  };
  property: {
    name: string;
    subtitle: string;
    projectType: string | null;
    category: string | null;
    city: string;
    locality: string;
    kind: string;
    possession: string;
    possessionDate: string;
    description: string | null;
    reraId: string | null;
    reraRegisteredAt: Date | null;
    reraCompletionAt: Date | null;
    areaAcres: number;
    towers: number;
    totalUnits: number | null;
    clubSizeSqft: number | null;
    configsLabel: string;
    gradientFrom: string;
    gradientTo: string;
  };
  pricing: {
    startingPriceLakh: number | null;
    maxPriceLakh: number | null;
    pricePerSqFt: number | null;
    priceRangeLabel: string;
    bookingAmount: number | null;
    maintenancePerSqft: number | null;
    startingDerived: boolean;
  };
  location: {
    metroMin: number | null;
    schoolMin: number | null;
    hospitalMin: number | null;
    expresswayMin: number | null;
    expresswayNote: string | null;
    mapsUrl: string | null;
    sector: string | null;
    connectivityIndex: number;
  };
  investment: {
    appreciationPct: number | null;
    rentalYieldPct: number | null;
    demandIndex: number;
    idealFor: string | null;
    investorFriendly: boolean | null;
    upcomingInfrastructure: string | null;
  };
  analysis: {
    locationScore: number | null;
    amenitiesScore: number | null;
    builderScore: number | null;
    investmentScore: number | null;
    overallRecommendation: string | null;
  };
  parking: {
    basement: number | null;
    ev: number | null;
    mechanical: number | null;
    open: number | null;
    total: number | null;
  };
  towers: {
    name: string;
    ceilingHeight: string | null;
    floorPlan: string | null;
    lifts: number | null;
    unitsPerFloor: number | null;
    totalUnits: number | null;
    sortOrder: number;
  }[];
  configurations: {
    label: string;
    areaSqFt: number;
    saleableAreaSqft: number | null;
    carpetAreaSqft: number | null;
    balconyAreaSqft: number | null;
    builtUpAreaSqft: number | null;
    priceLabel: string;
    floorPlanImage: string;
    sortOrder: number;
  }[];
  amenities: { key: string; label: string; available: boolean; note: string | null }[];
  media: { type: string; url: string; alt: string | null; sortOrder: number }[];
  attributes: { category: string; key: string; value: string; sortOrder: number }[];
}

export interface ValidationResult {
  ok: boolean; // false → at least one error → row skipped
  issues: Issue[];
  project: NormalizedProject | null;
}

const GRADIENTS: [string, string][] = [
  ["#0f3460", "#16697a"],
  ["#14532d", "#15803d"],
  ["#581c87", "#7c3aed"],
  ["#7c2d12", "#b45309"],
  ["#0e7490", "#0891b2"],
  ["#831843", "#9d174d"],
];
function pickGradient(seed: string): [string, string] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

const col = (m: Record<string, string[]>, k: string) => m[k] ?? [];

export function validateAndClean(parsed: ParsedProject): ValidationResult {
  const issues: Issue[] = [];
  const s = parsed.scalars;
  const err = (field: string, message: string) =>
    issues.push({ level: "error", field, message });
  const warn = (field: string, message: string) =>
    issues.push({ level: "warning", field, message });

  // ---- mandatory fields ----
  const projectName = C.str(s.projectName);
  const rawBuilderName = C.str(s.builderName);
  const fixedBuilderName = rawBuilderName
    ? BUILDER_NAME_FIXES[rawBuilderName] ?? rawBuilderName
    : rawBuilderName;
  const builderName = fixedBuilderName
    ? BUILDER_CANONICAL[fixedBuilderName.toUpperCase()] ?? fixedBuilderName
    : fixedBuilderName;
  const rawCity = C.str(s.city);
  const city = rawCity ? CITY_FIXES[rawCity] ?? rawCity : rawCity;
  if (!projectName) err("projectName", "Missing mandatory field: Project Name");
  if (!builderName) err("builderName", "Missing mandatory field: Builder Name");
  if (!city) err("city", "Missing mandatory field: City");

  // ---- configurations (unit types) ----
  const unitCats = col(parsed.configMatrix, "unitCategory");
  const saleable = col(parsed.configMatrix, "saleableArea");
  const carpet = col(parsed.configMatrix, "carpetArea");
  const balcony = col(parsed.configMatrix, "balconyArea");
  const builtup = col(parsed.configMatrix, "builtUpArea");
  const pricePerSqFt = C.parseMoney(s.pricePerSqFt);

  const configurations = unitCats
    .map((label, i) => {
      const saleableV = C.parseIntLoose(saleable[i]);
      const area = saleableV ?? 0;
      const priceLabel =
        pricePerSqFt && saleableV
          ? formatPriceLakh((pricePerSqFt * saleableV) / 100000)
          : "";
      return {
        label: C.str(label) ?? "",
        areaSqFt: area,
        saleableAreaSqft: saleableV,
        carpetAreaSqft: C.parseFloatLoose(carpet[i]),
        balconyAreaSqft: C.parseFloatLoose(balcony[i]),
        builtUpAreaSqft: C.parseFloatLoose(builtup[i]),
        priceLabel,
        floorPlanImage: "",
        sortOrder: i,
      };
    })
    .filter((c) => c.label);

  // ---- towers ----
  const towerNames = col(parsed.configMatrix, "towerNames");
  const ceiling = col(parsed.configMatrix, "ceilingHeight");
  const floors = col(parsed.configMatrix, "totalFloor");
  const lifts = col(parsed.configMatrix, "lift");
  const upf = col(parsed.configMatrix, "unitsPerFloor");
  const upt = col(parsed.configMatrix, "unitsPerTower");
  const towers = towerNames
    .map((name, i) => ({
      name: C.str(name) ?? `Tower ${i + 1}`,
      ceilingHeight: C.str(ceiling[i]),
      floorPlan: C.str(floors[i]),
      lifts: C.parseIntLoose(lifts[i]),
      unitsPerFloor: C.parseIntLoose(upf[i]),
      totalUnits: C.parseIntLoose(upt[i]),
      sortOrder: i,
    }))
    .filter((t) => C.str(t.name));

  if (towerNames.length && unitCats.length && towerNames.length !== unitCats.length)
    warn(
      "configuration",
      `Tower count (${towerNames.length}) ≠ unit-type count (${unitCats.length}) — matrix not aligned`,
    );

  // ---- pricing (derive starting price if only price/sqft given) ----
  let startingPriceLakh: number | null = null;
  let maxPriceLakh: number | null = null;
  let priceRangeLabel = "";
  let startingDerived = false;
  const givenStart = C.parseMoney(s.startingPrice);
  if (givenStart) {
    startingPriceLakh = givenStart / 100000;
    maxPriceLakh = C.parseMoney(s.maxPrice) ? C.parseMoney(s.maxPrice)! / 100000 : null;
  } else if (pricePerSqFt && configurations.length) {
    const areas = configurations.map((c) => c.areaSqFt).filter((a) => a > 0);
    if (areas.length) {
      startingPriceLakh = (pricePerSqFt * Math.min(...areas)) / 100000;
      maxPriceLakh = (pricePerSqFt * Math.max(...areas)) / 100000;
      startingDerived = true;
      warn(
        "startingPrice",
        "Starting/Max price derived from Price/Sq.Ft × unit area (no explicit price in sheet)",
      );
    }
  }
  if (startingPriceLakh != null)
    priceRangeLabel = maxPriceLakh
      ? `${formatPriceLakh(startingPriceLakh)} – ${formatPriceLakh(maxPriceLakh)}`
      : formatPriceLakh(startingPriceLakh);
  if (!pricePerSqFt && !givenStart)
    warn("pricing", "No pricing information found (Price/Sq.Ft and Starting Price both missing)");

  // ---- location (minutes, not km) ----
  const metroMin = C.parseMinutes(s.metroMin);
  const schoolMin = C.parseMinutes(s.schoolMin);
  const hospitalMin = C.parseMinutes(s.hospitalMin);
  const expresswayMin = C.parseMinutes(s.expresswayMin);
  const proximity = [metroMin, schoolMin, hospitalMin, expresswayMin].filter(
    (v): v is number => v != null,
  );
  const connectivityIndex = proximity.length
    ? Math.max(
        0,
        Math.min(100, Math.round(100 - proximity.reduce((a, b) => a + b, 0) * 2)),
      )
    : 0;
  const mapsUrl = C.str(s.mapsUrl);
  if (mapsUrl && !C.isUrl(mapsUrl)) warn("mapsUrl", `Invalid Google Maps URL: ${mapsUrl}`);

  // ---- investment (flag out-of-range, never alter) ----
  const appreciationPct = C.parsePercent(s.appreciationPct);
  const rentalYieldPct = C.parsePercent(s.rentalYieldPct);
  if (appreciationPct != null && (appreciationPct < 2 || appreciationPct > 25))
    warn(
      "appreciationPct",
      `Expected Appreciation ${appreciationPct}% out of expected range (2–25%) — review_required`,
    );
  if (rentalYieldPct != null && (rentalYieldPct < 1 || rentalYieldPct > 8))
    warn(
      "rentalYieldPct",
      `Rental Yield ${rentalYieldPct}% out of expected range (1–8%) — review_required`,
    );
  const investorFriendly = C.str(s.investorFriendly)
    ? C.parseYesNo(s.investorFriendly).available
    : null;
  const demandIndex = Math.max(
    0,
    Math.min(100, 50 + (appreciationPct ?? 0) * 2 + (investorFriendly ? 20 : 0)),
  );

  // ---- dates ----
  const reraRegisteredAt = parseDateField(s.reraRegisteredAt, "reraRegisteredAt", warn);
  const reraCompletionAt = parseDateField(s.reraCompletionAt, "reraCompletionAt", warn);

  // ---- builder numbers ----
  const delivered = C.parseCount(s.projectsDelivered);
  const ongoing = C.parseCount(s.ongoingProjects);

  // ---- status / possession ----
  const possession = C.normalizeStatus(s.projectStatus) ?? "Under Construction";
  if (s.projectStatus && !["Ready to Move", "Under Construction", "New Launch"].includes(possession))
    warn("projectStatus", `Unrecognised status "${s.projectStatus}" — defaulted`);

  // ---- amenities ----
  const amenities = parsed.amenities.map((a) => {
    const yn = C.parseYesNo(a.raw);
    return { key: a.slug, label: a.label, available: yn.available, note: yn.note };
  });

  // ---- media ----
  const media: NormalizedProject["media"] = [];
  const addMedia = (type: string, url: string | null) => {
    if (!url) return;
    if (!C.isUrl(url)) {
      warn(`media.${type}`, `Invalid ${type} URL: ${url}`);
      return;
    }
    media.push({ type, url, alt: null, sortOrder: media.length });
  };
  addMedia("logo", C.str(s.mediaLogo));
  addMedia("cover", C.str(s.mediaCover));
  addMedia("images_folder", C.str(s.mediaImagesFolder));
  addMedia("brochure", C.str(s.mediaBrochure));
  addMedia("video", C.str(s.mediaVideo));

  // ---- attributes (highlights + anything unmapped — never dropped) ----
  const attributes: NormalizedProject["attributes"] = [];
  parsed.highlights.forEach((h, i) => {
    if (C.str(h.value))
      attributes.push({ category: "highlight", key: h.key, value: h.value, sortOrder: i });
  });
  parsed.unmapped.forEach((u, i) => {
    if (C.str(u.value))
      attributes.push({
        category: u.section || "misc",
        key: u.label,
        value: u.value,
        sortOrder: i,
      });
  });

  // ---- configs label (derived) ----
  const bhks = Array.from(
    new Set(unitCats.map((u) => C.bhkCount(u)).filter((n): n is number => n != null)),
  ).sort((a, b) => a - b);
  const configsLabel = bhks.length ? `${bhks.join(" / ")} BHK` : "";

  const subtitle = [C.str(s.category), C.str(s.projectType)].filter(Boolean).join(" ");
  // Slug (idempotency key) + derived colour use the RAW name so a display-name
  // correction never changes a property's identity (avoids duplicate on re-import).
  const slug = C.slugify(rawBuilderName, projectName);

  const project: NormalizedProject | null =
    projectName && builderName && city
      ? {
          slug,
          sourceFile: parsed.sourceFile,
          builder: {
            name: builderName,
            rating: C.parseFloatLoose(s.builderRating),
            yearEstablished: C.parseYear(s.yearsInMarket),
            yearsInMarketRaw: C.str(s.yearsInMarket),
            deliveredProjects: delivered.value,
            deliveredProjectsRaw: delivered.raw,
            ongoingProjects: ongoing.value,
            logoColor: pickGradient(builderName)[0],
          },
          property: {
            name: projectName,
            subtitle,
            projectType: C.str(s.projectType),
            category: C.str(s.category),
            city,
            locality: C.str(s.sector) ?? C.str(s.fullAddress) ?? city,
            kind: "Apartment",
            possession,
            possessionDate: C.str(s.possessionDate) ?? "",
            description: C.str(s.description),
            reraId: C.str(s.reraNumber),
            reraRegisteredAt,
            reraCompletionAt,
            areaAcres: C.parseAcres(s.landArea) ?? 0,
            towers: towers.length,
            totalUnits: C.parseIntLoose(s.totalUnits),
            clubSizeSqft: C.parseIntLoose(s.clubSize),
            configsLabel,
            gradientFrom: pickGradient(slug)[0],
            gradientTo: pickGradient(slug)[1],
          },
          pricing: {
            startingPriceLakh,
            maxPriceLakh,
            pricePerSqFt,
            priceRangeLabel,
            bookingAmount: C.parseMoney(s.bookingAmount),
            maintenancePerSqft: C.parseFloatLoose(s.maintenance),
            startingDerived,
          },
          location: {
            metroMin,
            schoolMin,
            hospitalMin,
            expresswayMin,
            expresswayNote: C.str(s.expresswayMin),
            mapsUrl,
            sector: C.str(s.sector),
            connectivityIndex,
          },
          investment: {
            appreciationPct,
            rentalYieldPct,
            demandIndex,
            idealFor: C.str(s.idealFor),
            investorFriendly,
            upcomingInfrastructure: C.str(s.upcomingInfrastructure),
          },
          analysis: {
            locationScore: C.parseIntLoose(s.locationScore),
            amenitiesScore: C.parseIntLoose(s.amenitiesScore),
            builderScore: C.parseIntLoose(s.builderScore),
            investmentScore: C.parseIntLoose(s.investmentScore),
            overallRecommendation: C.str(s.overallRecommendation),
          },
          parking: {
            basement: C.parseIntLoose(parsed.parking.parkingBasement),
            ev: C.parseIntLoose(parsed.parking.parkingEv),
            mechanical: C.parseIntLoose(parsed.parking.parkingMechanical),
            open: C.parseIntLoose(parsed.parking.parkingOpen),
            total: C.parseIntLoose(parsed.parking.parkingTotal),
          },
          towers,
          configurations,
          amenities,
          media,
          attributes,
        }
      : null;

  return { ok: !issues.some((i) => i.level === "error"), issues, project };
}

function parseDateField(
  raw: string | undefined,
  field: string,
  warn: (f: string, m: string) => void,
): Date | null {
  if (!C.str(raw)) return null;
  const d = C.parseDate(raw);
  if (!d) warn(field, `Unparseable date: "${raw}"`);
  return d;
}
