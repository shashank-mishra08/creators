import type { Property } from "@/lib/types";

/**
 * Location maths for "properties near me".
 *
 * Pure and dependency-free so both server and client can import it. No external
 * geocoding service is involved: the user's position comes from the browser,
 * and every position we compare against is either a real stored coordinate or a
 * city centroid — nothing is fetched or guessed at request time.
 */

/**
 * Approximate centre of each market we operate in.
 *
 * Used only as a fallback for projects whose coordinates are unknown (28 of 38
 * at the time of writing, because their stored Google Maps links are
 * `share.google` URLs that resolve to a search page rather than a map). Matching
 * such a project at city level is honest; pinning it to a made-up street
 * address would not be.
 */
export const CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  Ghaziabad: { lat: 28.6692, lng: 77.4538 },
  "Greater Noida East": { lat: 28.4744, lng: 77.5040 },
  "Greater Noida West": { lat: 28.6082, lng: 77.4260 },
  "Noida Expressway": { lat: 28.5100, lng: 77.3910 },
  "Yamuna Expressway": { lat: 28.3200, lng: 77.5320 },
};

/** Anything further than this from the user is not "near" them. */
export const NEARBY_RADIUS_KM = 35;

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Best known position for a property: its own coordinates when we have them,
 * otherwise its city centroid. Returns null when neither is known, so callers
 * can leave such a property out of distance results rather than placing it at
 * some arbitrary default.
 */
export function positionOf(
  p: Property,
): { lat: number; lng: number; exact: boolean } | null {
  const { latitude, longitude } = p.location;
  if (latitude != null && longitude != null) {
    return { lat: latitude, lng: longitude, exact: true };
  }
  const centroid = CITY_CENTROIDS[p.city];
  if (centroid) return { ...centroid, exact: false };
  return null;
}

export interface RankedProperty {
  property: Property;
  km: number;
  /** False when the distance is derived from a city centroid, not a real pin. */
  exact: boolean;
}

/** Every property that has a usable position, nearest first. */
export function rankByDistance(
  properties: Property[],
  origin: { lat: number; lng: number },
): RankedProperty[] {
  return properties
    .map((property) => {
      const pos = positionOf(property);
      if (!pos) return null;
      return {
        property,
        km: distanceKm(origin, pos),
        exact: pos.exact,
      };
    })
    .filter((r): r is RankedProperty => r !== null)
    .sort((a, b) => a.km - b.km);
}

/** Nearest known city to a position — used to label a result set. */
export function nearestCity(origin: { lat: number; lng: number }): {
  city: string;
  km: number;
} | null {
  const entries = Object.entries(CITY_CENTROIDS);
  if (entries.length === 0) return null;

  let best = { city: entries[0][0], km: distanceKm(origin, entries[0][1]) };
  for (const [city, centroid] of entries.slice(1)) {
    const km = distanceKm(origin, centroid);
    if (km < best.km) best = { city, km };
  }
  return best;
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
