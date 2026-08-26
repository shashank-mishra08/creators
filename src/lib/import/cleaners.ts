/**
 * Value cleaners — turn the messy human-entered Excel strings into typed values.
 * Each returns a typed value (or null) so the validator can flag what's missing.
 * Cleaners NEVER fabricate business numbers; derivations are clearly separate
 * (see normalizer) and flagged.
 */

export function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/** "12999/-" | "₹12,999" | 12999 → 12999 */
export function parseMoney(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const digits = s.replace(/[^0-9.]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

/** "4.48 Acer" → 4.48 */
export function parseAcres(v: unknown): number | null {
  return parseFloatLoose(v);
}

/** first number in a string ("2min", "5 min to Noida…") → 2 */
export function parseMinutes(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const m = s.match(/\d+(\.\d+)?/);
  return m ? Math.round(Number(m[0])) : null;
}

export function parseIntLoose(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/-?\d+/);
  return m ? parseInt(m[0], 10) : null;
}

export function parseFloatLoose(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** "100+" → { value: 100, raw: "100+" }; "0" → { value: 0 } */
export function parseCount(v: unknown): { value: number | null; raw: string | null } {
  const raw = str(v);
  return { value: parseIntLoose(v), raw };
}

/** "from 1990" → 1990 */
export function parseYear(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const m = s.match(/(19|20)\d{2}/);
  return m ? parseInt(m[0], 10) : null;
}

/** "May 20, 2025" | " Jan 29, 2030" | "Dec 2028" → Date | null */
export function parseDate(v: unknown): Date | null {
  const s = str(v);
  if (!s) return null;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t);
  // "Dec 2028" → first of month
  const m = s.match(/([A-Za-z]{3,})\s+((?:19|20)\d{2})/);
  if (m) {
    const t2 = Date.parse(`${m[1]} 1, ${m[2]}`);
    if (!Number.isNaN(t2)) return new Date(t2);
  }
  return null;
}

/** "yes ", "Yes, Olympic Size" → { available: true, note }; "No"/"" → false */
export function parseYesNo(v: unknown): { available: boolean; note: string | null } {
  const s = str(v);
  if (!s) return { available: false, note: null };
  const low = s.toLowerCase();
  const available = low.startsWith("y") || low === "true" || low === "1";
  // anything after "yes," is a note
  const noteMatch = s.match(/^[^,]+,\s*(.+)$/);
  const note = available && noteMatch ? noteMatch[1].trim() : null;
  return { available, note };
}

export function parsePercent(v: unknown): number | null {
  return parseFloatLoose(v);
}

/** Normalise free-text status to the canonical frontend values. */
export function normalizeStatus(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  const low = s.toLowerCase();
  if (low.includes("construct")) return "Under Construction";
  if (low.includes("ready")) return "Ready to Move";
  // Before the plain "launch" rule below, which would otherwise swallow this
  // and file a pre-launch project as a new launch without saying so.
  if (/pre[\s-]*launch/.test(low)) return "Pre Launch";
  if (low.includes("launch")) return "New Launch";
  return s; // keep raw; validator will flag unknown
}

/** Stable import key, e.g. ("Northwind Estate","Sanctury") → "northwind-estate-sanctury" */
export function slugify(...parts: (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "4BHK + S" | "2BHK+U" → 4 / 2 (the BHK count) */
export function bhkCount(label: string): number | null {
  const m = String(label).match(/(\d+)\s*bhk/i);
  return m ? parseInt(m[1], 10) : null;
}

export function isUrl(v: unknown): boolean {
  const s = str(v);
  if (!s) return false;
  // Allow local asset paths (either starting with / or something like properties/image.jpg)
  if (s.startsWith("/") || s.match(/\.(jpg|jpeg|png|webp)$/i)) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
