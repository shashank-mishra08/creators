"use client";

/**
 * The last few property ids this visitor opened, kept in localStorage.
 *
 * Deliberately not in the database: it is a per-device convenience for the
 * review form's "Recent Properties" list, it must work for signed-out visitors,
 * and it is not worth a write on every page view.
 */
const KEY = "creators-recent-properties";
const LIMIT = 6;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    // Any shape but an array of strings is treated as absent rather than
    // trusted — this value is user-writable.
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(0, LIMIT)
      : [];
  } catch {
    return [];
  }
}

export function getRecentPropertyIds(): string[] {
  return read();
}

/** Record a visit, most recent first, without duplicates. */
export function rememberProperty(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const next = [id, ...read().filter((v) => v !== id)].slice(0, LIMIT);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private browsing / storage full — losing the history is harmless.
  }
}
