/**
 * The search box and the location picker now exist twice — once in the navbar
 * and once in the listing toolbar — and the two have to agree. The address bar
 * is the channel between them: both read `?q=` and `?city=`, so there is one
 * source of truth rather than two copies to keep in sync.
 *
 * Writes go through `@/lib/url-params`, which explains why they do not
 * navigate.
 */
import { replaceParams } from "@/lib/url-params";


export const QUERY_PARAM = "q";
export const CITY_PARAM = "city";

/** Where the navbar controls apply — the two pages that render the explorer. */
export function isListingPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/properties";
}

/** `"Noida,Gurugram"` → `["Noida", "Gurugram"]`; junk and blanks dropped. */
export function parseCities(value: string | null | undefined): string[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((c) => c.trim()).filter(Boolean))];
}

export function serializeCities(cities: Iterable<string>): string {
  return [...cities].join(",");
}

/**
 * Update the listing params in place. Omitted keys are left alone, so the
 * search box can write `q` without disturbing a city the picker has set.
 */
export function writeListingParams(next: { q?: string; cities?: Iterable<string> }): void {
  replaceParams({
    // A query of only spaces is not a query — but the spaces themselves are
    // kept, so a term being typed either side of one survives the round trip.
    ...(next.q !== undefined && { [QUERY_PARAM]: next.q.trim() ? next.q : null }),
    ...(next.cities !== undefined && { [CITY_PARAM]: serializeCities(next.cities) || null }),
  });
}

/**
 * Is either listing control carrying a value right now?
 *
 * Takes anything with a `get` — `URLSearchParams` and the read-only object
 * `useSearchParams` hands back both qualify — so a caller can ask this of the
 * live params or of `window.location.search` before React has run.
 */
export function hasListingSearch(params: { get(name: string): string | null }): boolean {
  return (
    (params.get(QUERY_PARAM) ?? "").trim() !== "" ||
    parseCities(params.get(CITY_PARAM)).length > 0
  );
}

/**
 * The listing URL showing one city's projects.
 *
 * One definition, because these links are now written from more than one place
 * — the footer's Locations column, the Trending Localities row and a property's
 * breadcrumb all have to agree with what the listing actually reads.
 */
export function cityListingPath(city: string): string {
  return `/properties?${CITY_PARAM}=${encodeURIComponent(city)}`;
}
