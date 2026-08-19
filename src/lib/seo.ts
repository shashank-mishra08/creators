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
  email: "contact@creatorshome.in",
  website: "www.creatorshome.in",
  address: "E-219, 2nd Floor, Sector 63, Noida 201301",
};

/** URL-safe slug for city / builder names already stored on the property. */
export function seoSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function propertyPath(p: { slug?: string | null; id: string }): string {
  const key = p.slug?.trim() || p.id;
  return `/properties/${key}`;
}

export function cityPath(city: string): string {
  return `/locations/${seoSlug(city)}`;
}

export function builderPath(name: string): string {
  return `/builders/${seoSlug(name)}`;
}

/**
 * Turn a media src into an absolute URL. Cloudinary (and any other http(s))
 * paths are left alone — prefixing SITE_URL onto them used to produce
 * `https://www.creatorshome.inhttps://res.cloudinary.com/…`.
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

export function findBySlug<T>(items: T[], slug: string, nameOf: (item: T) => string): T | undefined {
  return items.find((item) => seoSlug(nameOf(item)) === slug);
}

function unique(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.map((v) => (v ?? "").trim()).filter(Boolean))];
}

function priced(properties: Property[]): Property[] {
  return properties.filter((p) => p.priceLakh > 0);
}

function priceSpan(properties: Property[]): string {
  const list = priced(properties);
  if (list.length === 0) return "";
  const min = Math.min(...list.map((p) => p.priceLakh));
  const max = Math.max(...list.map((p) => p.priceLakh));
  if (min === max) return `from ${formatPriceLakh(min)}`;
  return `from ${formatPriceLakh(min)} to ${formatPriceLakh(max)}`;
}

export function propertyFaqs(p: Property): { q: string; a: string }[] {
  const areas = p.floorPlans.map((f) => f.areaSqFt).filter((n) => n > 0);
  const areaBit = areas.length
    ? `, from ${Math.min(...areas).toLocaleString("en-IN")} sq.ft onwards`
    : "";
  return [
    {
      q: `What is the possession date of ${p.name}?`,
      a:
        p.possession === "Ready to Move"
          ? `${p.name} is ready to move in ${p.locality}, ${p.city}.`
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
      a: `${p.name} offers ${p.configs || "residential"} configurations${areaBit} in ${p.locality}, ${p.city}.`,
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

export function cityLandingCopy(city: string, properties: Property[]) {
  const n = properties.length;
  const builders = unique(properties.map((p) => p.builder.name));
  const kinds = unique(properties.map((p) => p.kind));
  const span = priceSpan(properties);
  const kindLabel = kinds.length ? kinds.join(", ").toLowerCase() : "homes";
  const title = `Properties in ${city}`;
  const description = `${n} ${kindLabel}${n === 1 ? "" : "s"} in ${city}${
    span ? ` ${span}` : ""
  }. Compare price, amenities, location and builders on Creators Arena.`;
  const intro =
    n === 0
      ? `Live projects in ${city} will appear here as they are published.`
      : `${n} live ${n === 1 ? "project" : "projects"}${
          span ? ` ${span}` : ""
        }${builders.length ? ` · ${builders.slice(0, 3).join(", ")}` : ""}.`;
  const faqs = [
    {
      q: `Are there flats for sale in ${city}?`,
      a:
        n > 0
          ? `Yes — ${n} ${n === 1 ? "project is" : "projects are"} listed in ${city}${
              span ? `, ${span}` : ""
            }. Open any project to see configurations, floor plans and RERA details.`
          : `Listings for ${city} are being added. Check back or browse nearby NCR locations.`,
    },
    {
      q: `Which builders have projects in ${city}?`,
      a: builders.length
        ? `${builders.join(", ")} currently have projects listed in ${city}.`
        : `Builder listings for ${city} will appear here as projects go live.`,
    },
    {
      q: `Can I compare properties in ${city}?`,
      a: `Yes. Shortlist 2–4 projects from ${city} and open Compare for a side-by-side score on price, amenities, location, builder and ROI.`,
    },
  ];
  return { title, description, intro, faqs };
}

export function builderLandingCopy(builder: string, properties: Property[]) {
  const n = properties.length;
  const cities = unique(properties.map((p) => p.city));
  const span = priceSpan(properties);
  const title = `${builder} projects in NCR`;
  const description = `${n} ${builder} ${
    n === 1 ? "project" : "projects"
  } across ${cities.join(", ") || "NCR"}${span ? `, ${span}` : ""}. Compare configurations, location and investment potential.`;
  const intro =
    n === 0
      ? `${builder} projects will appear here as they are published.`
      : `${n} live ${n === 1 ? "project" : "projects"}${
          cities.length ? ` in ${cities.join(", ")}` : ""
        }${span ? ` ${span}` : ""}.`;
  const faqs = [
    {
      q: `Which ${builder} projects are listed?`,
      a: n
        ? `${properties.map((p) => p.name).join(", ")}.`
        : `${builder} listings are being added.`,
    },
    {
      q: `Where are ${builder} projects located?`,
      a: cities.length
        ? `${builder} currently has projects in ${cities.join(", ")}.`
        : `Locations will show here once projects are live.`,
    },
  ];
  return { title, description, intro, faqs };
}

export function propertyTitle(p: Property): string {
  return `${p.name} in ${p.locality}, ${p.city}`;
}

export function propertyDescription(p: Property): string {
  const priceBit = p.priceLakh > 0 ? ` from ${formatPriceLakh(p.priceLakh)}` : "";
  return `${p.name} by ${p.builder.name} in ${p.locality}, ${p.city}. ${
    p.configs || "Residential"
  }${priceBit}. Compare price, amenities, location and investment potential on Creators Arena.`;
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

export function itemListJsonLd(name: string, path: string, properties: Property[]) {
  return {
    "@type": "ItemList",
    name,
    url: absoluteUrl(path),
    numberOfItems: properties.length,
    itemListElement: properties.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(propertyPath(p)),
      name: p.name,
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
      addressLocality: property.locality,
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
      { name: property.city, path: cityPath(property.city) },
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
