/**
 * Alias-driven field mapping for the Excel importer.
 *
 * Everything is matched by *normalised label* (lowercase, alphanumeric only) so
 * typos / spacing variants in real sheets ("Cealing Hights", "Tota Parking",
 * "Under Constructionction") and future minor changes import WITHOUT code edits.
 * Unknown fields are never dropped — they are routed to PropertyAttribute.
 */

export function norm(label: string): string {
  return String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/** Section titles (normalised) used to track context while walking rows. */
export const SECTIONS: Record<string, string> = {
  basicinformation: "basic",
  locationdetails: "location",
  pricinginformation: "pricing",
  configurationdetails: "configuration",
  highlight: "highlight",
  amenitiesyesno: "amenities",
  amenities: "amenities",
  builderinformation: "builder",
  investmentinsights: "investment",
  mediaassets: "media",
  creatorsinternalanalysis: "analysis",
};

type Target = "scalar" | "matrix" | "parking";

/** canonicalKey -> where it goes. */
export const FIELD_TARGET: Record<string, Target> = {
  // basic
  projectName: "scalar",
  builderName: "scalar",
  projectType: "scalar",
  category: "scalar",
  projectStatus: "scalar",
  reraNumber: "scalar",
  reraRegisteredAt: "scalar",
  reraCompletionAt: "scalar",
  possessionDate: "scalar",
  description: "scalar",
  // location
  city: "scalar",
  sector: "scalar",
  fullAddress: "scalar",
  mapsUrl: "scalar",
  metroMin: "scalar",
  schoolMin: "scalar",
  hospitalMin: "scalar",
  expresswayMin: "scalar",
  // pricing
  pricePerSqFt: "scalar",
  startingPrice: "scalar",
  maxPrice: "scalar",
  bookingAmount: "scalar",
  maintenance: "scalar",
  // configuration scalars
  landArea: "scalar",
  totalUnits: "scalar",
  clubSize: "scalar",
  availableConfigurations: "scalar",
  sizeRange: "scalar",
  // configuration matrix
  towerNames: "matrix",
  ceilingHeight: "matrix",
  totalFloor: "matrix",
  lift: "matrix",
  unitsPerFloor: "matrix",
  unitsPerTower: "matrix",
  unitCategory: "matrix",
  saleableArea: "matrix",
  carpetArea: "matrix",
  balconyArea: "matrix",
  builtUpArea: "matrix",
  // parking (lives in the amenities section in the real sheets)
  parkingBasement: "parking",
  parkingEv: "parking",
  parkingMechanical: "parking",
  parkingOpen: "parking",
  parkingTotal: "parking",
  // builder
  yearsInMarket: "scalar",
  projectsDelivered: "scalar",
  ongoingProjects: "scalar",
  builderRating: "scalar",
  // investment
  idealFor: "scalar",
  appreciationPct: "scalar",
  rentalYieldPct: "scalar",
  upcomingInfrastructure: "scalar",
  investorFriendly: "scalar",
  // media
  mediaLogo: "scalar",
  mediaCover: "scalar",
  mediaImagesFolder: "scalar",
  mediaBrochure: "scalar",
  mediaVideo: "scalar",
  // internal analysis
  locationScore: "scalar",
  amenitiesScore: "scalar",
  builderScore: "scalar",
  investmentScore: "scalar",
  overallRecommendation: "scalar",
};

/** normalised source label -> canonicalKey (tolerant of the real typos). */
export const ALIASES: Record<string, string> = {
  projectname: "projectName",
  buildername: "builderName",
  projecttype: "projectType",
  propertycategory: "category",
  projectstatus: "projectStatus",
  reranumber: "reraNumber",
  reraregistrationdate: "reraRegisteredAt",
  reracompletiondate: "reraCompletionAt",
  proposedpossessiondate: "possessionDate",
  possessiondate: "possessionDate",
  projectdescription: "description",
  city: "city",
  sectorarea: "sector",
  fulladdress: "fullAddress",
  googlemapslink: "mapsUrl",
  distancefrommetro: "metroMin",
  distancefromschool: "schoolMin",
  distancefromhospital: "hospitalMin",
  distancefromexpressway: "expresswayMin",
  pricepersqft: "pricePerSqFt",
  startingprice: "startingPrice",
  maximumprice: "maxPrice",
  bookingamount: "bookingAmount",
  maintenancecharges: "maintenance",
  totallandarea: "landArea",
  totalunits: "totalUnits",
  clubsizeinsqft: "clubSize",
  clubsize: "clubSize",
  availableconfigurations: "availableConfigurations",
  sizerangesqft: "sizeRange",
  totaltowers: "towerNames",
  cealinghights: "ceilingHeight",
  ceilingheights: "ceilingHeight",
  ceilingheight: "ceilingHeight",
  totalfloor: "totalFloor",
  totalfloors: "totalFloor",
  lift: "lift",
  unitsperfloor: "unitsPerFloor",
  totalunitsintower: "unitsPerTower",
  unitscategory: "unitCategory",
  saleableareainsqft: "saleableArea",
  saleablearea: "saleableArea",
  carpetareainsqft: "carpetArea",
  carpetarea: "carpetArea",
  balconyareainsqft: "balconyArea",
  balconyarea: "balconyArea",
  builtupareainsqft: "builtUpArea",
  builtuparea: "builtUpArea",
  basementparking: "parkingBasement",
  basementevparking: "parkingEv",
  basementmachenicalparking: "parkingMechanical",
  basementmechanicalparking: "parkingMechanical",
  openparking: "parkingOpen",
  totalparking: "parkingTotal",
  totaparking: "parkingTotal",
  yearsinmarket: "yearsInMarket",
  projectsdelivered: "projectsDelivered",
  ongoingprojects: "ongoingProjects",
  builderrating: "builderRating",
  idealforinvestmentselfuseboth: "idealFor",
  idealfor: "idealFor",
  expectedappreciation: "appreciationPct",
  rentalyield: "rentalYieldPct",
  upcominginfrastructure: "upcomingInfrastructure",
  investorfriendlyyesno: "investorFriendly",
  investorfriendly: "investorFriendly",
  projectlogolink: "mediaLogo",
  coverimagelink: "mediaCover",
  propertyimagesfolderlink: "mediaImagesFolder",
  brochurepdflink: "mediaBrochure",
  videotourlink: "mediaVideo",
  locationscore: "locationScore",
  amenitiesscore: "amenitiesScore",
  builderscore: "builderScore",
  investmentscore: "investmentScore",
  overallrecommendation: "overallRecommendation",
};

// strip trailing "(%)", "(1-10)", "(in sq. ft.)" etc. before alias lookup
export function resolveKey(label: string): string | null {
  const n = norm(label);
  if (ALIASES[n]) return ALIASES[n];
  // tolerant: a known alias is a prefix of the label (handles trailing
  // units/notes like "Saleable Area (In Sq. Ft.)"). Min length avoids
  // accidental matches on very short tokens.
  let best: string | null = null;
  for (const alias of Object.keys(ALIASES)) {
    if (alias.length >= 5 && n.startsWith(alias)) {
      if (!best || alias.length > best.length) best = alias; // longest wins
    }
  }
  return best ? ALIASES[best] : null;
}

/** Known amenity labels → stable slug. Unknowns in the amenities section get a
 *  derived slug, so new amenities import automatically. */
export function amenitySlug(label: string): string {
  return norm(label);
}
