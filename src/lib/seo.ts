import { SITE_URL } from "@/lib/constants";
import { formatPriceLakh } from "@/lib/utils";
import type { Property } from "@/lib/types";
import type { PublicSettings } from "@/lib/services/settings.service";

/** Display name used in titles, JSON-LD and the footer. */
export const SITE_NAME = "Creators Arena";

export const SOCIAL_TITLE = "Creators Arena — Compare Properties Smarter";

export const DEFAULT_DESCRIPTION =
  "Compare residential properties across Noida, Greater Noida, Ghaziabad and Yamuna Expressway. Price, amenities, location, builder reputation and investment potential — find the best home in minutes.";

/**
 * Fallback NAP (name, address, phone) when admin Settings are blank.
 * Display-only — never written back to the database.
 */
export const SITE_NAP = {
  tagline:
    "At Creators Arena, we don't just close deals — we help you find the perfect space to grow, live, or build your dreams. Your gateway to smart property decisions.",
  rera: "UPRERAAGT0000827072025",
  phone: "+91-9891321123",
  email: "contact@creatorsarena.in",
  website: "www.creatorsarena.in",
  address: "E-219, 2nd Floor, Sector 63, Noida 201301",
};

export function propertyPath(p: { slug?: string | null; id: string }): string {
  const key = p.slug?.trim() || p.id;
  return `/properties/${key}`;
}

function collapseWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Presentation-only. Does not write the database.
 * Bare numeric localities become "Sector N". Named values stay as stored.
 * YE 22A/22D/25 become "Sector …" only when city is Yamuna Expressway.
 */
export function formatLocalityLabel(locality: string, city?: string): string {
  const raw = collapseWs(locality);
  if (!raw) return raw;
  if (/^sector\b/i.test(raw)) return raw;

  const ye = collapseWs(city ?? "") === "Yamuna Expressway";
  if (ye && /^22[a-d]$/i.test(raw)) {
    return `Sector 22${raw.slice(-1).toUpperCase()}`;
  }
  if (ye && raw === "25") return "Sector 25";

  if (/^\d+$/.test(raw)) return `Sector ${raw}`;
  return raw;
}

/** Collapse "Saviour Saviour New" / "Max Estate Estate 105" without inventing names. */
export function formatPropertyHeading(builderName: string, projectName: string): string {
  const builder = collapseWs(builderName);
  const project = collapseWs(projectName);
  if (!builder) return project;
  if (!project) return builder;

  const bLow = builder.toLowerCase();
  const pLow = project.toLowerCase();
  if (pLow === bLow || pLow.startsWith(`${bLow} `)) return project;

  const last = builder.split(" ").pop() ?? "";
  const parts = project.split(" ");
  if (last && parts[0].toLowerCase() === last.toLowerCase()) {
    const rest = parts.slice(1).join(" ");
    return rest ? `${builder} ${rest}` : builder;
  }
  return `${builder} ${project}`;
}

/** "3BHK+3T / 4BHK+4T+U" → "3/4 BHK" for titles. */
export function compactBhkLabel(configs: string): string {
  const s = collapseWs(configs);
  if (!s) return "";
  // "3 / 4 BHK" — digits are not glued to the word BHK.
  const slashList = s.match(/^(\d+(?:\s*\/\s*\d+)+)\s*bhk\b/i);
  let nums: string[];
  if (slashList) {
    nums = [...new Set(slashList[1].match(/\d+/g) ?? [])];
  } else {
    nums = [...new Set([...s.matchAll(/(\d+)\s*bhk/gi)].map((m) => m[1]))];
    if (nums.length === 0 && /bhk/i.test(s)) {
      nums = [...new Set(s.match(/\d+/g) ?? [])];
    }
  }
  nums.sort((a, b) => Number(a) - Number(b));
  return nums.length ? `${nums.join("/")} BHK` : s;
}

/** Presentation-only status fix for the known sheet typo. */
export function formatPossessionLabel(possession: string): string {
  const s = collapseWs(possession);
  if (/constuction/i.test(s) || /^under\s+construct/i.test(s)) return "Under Construction";
  return s;
}

/**
 * Turn a media src into an absolute URL. Cloudinary (and any other http(s))
 * paths are left alone — prefixing SITE_URL onto them used to produce
 * `https://www.creatorsarena.inhttps://res.cloudinary.com/…`.
 */
export function absoluteMediaUrl(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("//")) return `https:${src}`;
  const path = src.startsWith("/") ? src : `/${src}`;
  return `${SITE_URL}${path}`;
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalised}`;
}

export function propertyFaqs(p: Property): { q: string; a: string }[] {
  const loc = formatLocalityLabel(p.locality, p.city);
  const areas = p.floorPlans.map((f) => f.areaSqFt).filter((n) => n > 0);
  const areaBit = areas.length
    ? `, from ${Math.min(...areas).toLocaleString("en-IN")} sq.ft onwards`
    : "";
  return [
    {
      q: `What is the possession date of ${p.name}?`,
      a:
        p.possession === "Ready to Move"
          ? `${p.name} is ready to move in ${loc}, ${p.city}.`
          : `Possession at ${p.name} is expected by ${p.possessionDate}.`,
    },
    {
      q: `Is ${p.name} RERA registered?`,
      a: p.reraId
        ? `Yes, ${p.name} is RERA registered (RERA ID: ${p.reraId}).`
        : "RERA details are being updated for this project.",
    },
    {
      q: `What configurations are available at ${p.name}?`,
      a: `${p.name} offers ${p.configs || "residential"} configurations${areaBit} in ${loc}, ${p.city}.`,
    },
    {
      q: `How far is ${p.name} from the metro?`,
      a:
        p.location.metroKm > 0
          ? `The nearest metro station is approximately ${p.location.metroKm} minutes from ${p.name}.`
          : `Metro timing for ${p.name} is being updated. Check the location section for other connectivity.`,
    },
  ];
}

export function propertyTitle(p: Property): string {
  const loc = formatLocalityLabel(p.locality, p.city);
  const heading = formatPropertyHeading(p.builder.name, p.name);
  const bhk = compactBhkLabel(p.configs);
  const where = `${heading} in ${loc}, ${p.city}`;
  if (p.priceLakh > 0 && bhk) return `${where} | ${bhk} from ${formatPriceLakh(p.priceLakh)}`;
  if (p.priceLakh > 0) return `${where} | from ${formatPriceLakh(p.priceLakh)}`;
  if (bhk) return `${where} | ${bhk}`;
  return where;
}

export function propertyDescription(p: Property): string {
  const loc = formatLocalityLabel(p.locality, p.city);
  const heading = formatPropertyHeading(p.builder.name, p.name);
  const bhk = compactBhkLabel(p.configs) || p.configs || "Residential";
  const possession = formatPossessionLabel(p.possession);
  const pricePart =
    p.priceLakh > 0 ? `starting ${formatPriceLakh(p.priceLakh)}` : "price on request";
  return `${heading} in ${loc}, ${p.city}. ${bhk}, ${possession}, ${pricePart}. Compare with similar NCR projects on Creators Arena.`;
}

function jsonLdGraph(nodes: Record<string, unknown>[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

export function organizationNode(settings?: PublicSettings | null): Record<string, unknown> {
  const phone = settings?.contactPhone?.trim() || SITE_NAP.phone;
  const email = settings?.contactEmail?.trim() || SITE_NAP.email;
  const address = settings?.officeAddress?.trim() || SITE_NAP.address;
  const sameAs = [
    settings?.instagramUrl,
    settings?.facebookUrl,
    settings?.linkedinUrl,
    settings?.youtubeUrl,
  ]
    .map((u) => u?.trim())
    .filter((u): u is string => Boolean(u));

  const node: Record<string, unknown> = {
    "@type": ["RealEstateAgent", "LocalBusiness"],
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    telephone: phone,
    email,
    image: absoluteUrl("/brand/creators-logo.png"),
    logo: absoluteUrl("/brand/creators-arena-logo.svg"),
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: "Noida",
      addressRegion: "Uttar Pradesh",
      postalCode: "201301",
      addressCountry: "IN",
    },
    areaServed: [
      "Noida",
      "Greater Noida",
      "Greater Noida West",
      "Ghaziabad",
      "Yamuna Expressway",
      "Noida Expressway",
    ],
  };
  if (sameAs.length) node.sameAs = sameAs;
  return node;
}

export function websiteNode(): Record<string, unknown> {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/properties?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function siteJsonLd(settings?: PublicSettings | null) {
  return jsonLdGraph([organizationNode(settings), websiteNode()]);
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function propertyJsonLd(
  property: Property,
  reviews: { averageRating: number | null; count: number } | null,
) {
  const url = absoluteUrl(propertyPath(property));
  const schemaType = property.kind === "Apartment" ? "ApartmentComplex" : "Residence";
  const node: Record<string, unknown> = {
    "@type": schemaType,
    name: property.name,
    description: propertyDescription(property),
    url,
    category: property.kind,
    brand: { "@type": "Organization", name: property.builder.name },
    address: {
      "@type": "PostalAddress",
      addressLocality: formatLocalityLabel(property.locality, property.city),
      addressRegion: property.city,
      addressCountry: "IN",
    },
  };
  const image = absoluteMediaUrl(property.image);
  if (image) node.image = image;
  if (property.totalUnits) node.numberOfAccommodationUnits = property.totalUnits;
  if (property.location.latitude != null && property.location.longitude != null) {
    node.geo = {
      "@type": "GeoCoordinates",
      latitude: property.location.latitude,
      longitude: property.location.longitude,
    };
  }
  const amenities = property.amenityList.filter((a) => a.available).map((a) => a.label);
  if (amenities.length) {
    node.amenityFeature = amenities.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
    }));
  }
  if (property.priceLakh > 0) {
    node.offers = {
      "@type": "Offer",
      price: Math.round(property.priceLakh * 100000),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url,
    };
  }
  if (reviews && reviews.averageRating != null && reviews.count > 0) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviews.averageRating,
      reviewCount: reviews.count,
    };
  }
  return jsonLdGraph([
    node,
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Properties", path: "/properties" },
      { name: property.name, path: propertyPath(property) },
    ]),
    faqJsonLd(propertyFaqs(property)),
  ]);
}

/** Allow-list for GA4 measurement IDs so a bad Settings value cannot inject script. */
export function safeGa4Id(raw: string | null | undefined): string | null {
  const id = raw?.trim() ?? "";
  return /^G-[A-Z0-9]+$/i.test(id) ? id : null;
}

/** Allow-list for Meta pixel IDs (digits only). */
export function safeMetaPixelId(raw: string | null | undefined): string | null {
  const id = raw?.trim() ?? "";
  return /^\d{5,20}$/.test(id) ? id : null;
}
