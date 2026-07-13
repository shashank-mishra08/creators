import type { City, Possession, PropertyKind } from "@/lib/types";

/**
 * Pure, dependency-free constants safe to import from BOTH client and server.
 * (Kept out of `data-source.ts` so client components don't pull the Prisma
 * client into their bundle.)
 */

export const CITIES: City[] = [
  "Greater Noida East",
  "Greater Noida West",
  "Yamuna Expressway",
];

export const KINDS: PropertyKind[] = [
  "Apartment",
  "Villa",
  "Plot",
  "Builder Floor",
];

export const POSSESSIONS: Possession[] = [
  "Ready to Move",
  "Under Construction",
  "New Launch",
];

/** Comparison selection limits (shared by UI store and backend services). */
export const MIN_COMPARE = 2;
export const MAX_COMPARE = 4;

/**
 * Absolute site origin, used server-side for SEO (metadataBase, canonical URLs,
 * sitemap, robots). Override with APP_URL in production; falls back to the
 * public domain. Only read on the server — safe as a plain constant.
 */
export const SITE_URL =
  process.env.APP_URL?.replace(/\/$/, "") || "https://www.creatorshome.in";
