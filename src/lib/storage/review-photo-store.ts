import path from "node:path";

/**
 * Local-disk store for review photos, used when Cloudinary is not configured.
 *
 * Files deliberately live OUTSIDE `public/`. In a production build Next.js
 * collects `public/` at build time, so a file written after the server started
 * is not served until the next restart — an upload would appear to succeed and
 * then 404. Serving through a route handler reads from disk per request, so it
 * works in dev and in production alike.
 */
export const REVIEW_PHOTO_DIR = path.join(process.cwd(), ".uploads", "reviews");

/** The public URL path a stored photo is served from. */
export const REVIEW_PHOTO_URL_PREFIX = "/api/review-photos/";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const REVIEW_PHOTO_TYPES = Object.keys(EXT_BY_TYPE);

export function extensionFor(mimeType: string): string | null {
  return EXT_BY_TYPE[mimeType] ?? null;
}

/**
 * Generated names only: `review-<uuid>.<ext>`.
 *
 * This is the single guard between a URL segment and a filesystem read, so it
 * is an allow-list rather than a check for "../" — no separator, no traversal,
 * no dotfile and no unexpected extension can pass it.
 */
const SAFE_NAME = /^review-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export function isSafePhotoName(name: string): boolean {
  return SAFE_NAME.test(name);
}

export function contentTypeFor(name: string): string {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
