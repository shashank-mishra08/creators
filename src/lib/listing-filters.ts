/**
 * The search box and the location picker now exist twice — once in the navbar
 * and once in the listing toolbar — and the two have to agree. The address bar
 * is the channel between them: both read `?q=` and `?city=`, so there is one
 * source of truth rather than two copies to keep in sync.
 *
 * Writes go through `history.replaceState` rather than `router.push`. Both
 * listing pages are `force-dynamic`, so a router navigation would re-run the
 * database query and re-render the whole page on every keystroke. Next patches
 * the History API to notify the router, so `useSearchParams` still updates —
 * without the round trip. `replaceState` (not `pushState`) also keeps Back
 * pointing at the previous page instead of the previous keystroke.
 */

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
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);

  if (next.q !== undefined) {
    const q = next.q.trim();
    q ? params.set(QUERY_PARAM, next.q) : params.delete(QUERY_PARAM);
  }
  if (next.cities !== undefined) {
    const cities = serializeCities(next.cities);
    cities ? params.set(CITY_PARAM, cities) : params.delete(CITY_PARAM);
  }

  const qs = params.toString();
  window.history.replaceState(
    null,
    "",
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
  );
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
