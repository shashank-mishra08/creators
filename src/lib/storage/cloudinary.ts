/**
 * Image storage on Cloudinary.
 *
 * Uses Cloudinary's REST upload API (no SDK dependency) when credentials are
 * set. Without them (local dev / before storage is configured) `isConfigured`
 * is false and callers fall back to writing into public/ — see
 * src/app/api/admin/upload/route.ts.
 *
 * Why this exists: writing uploads to the server's disk only works on the one
 * machine that received them. Files never reach other developers or survive a
 * redeploy, so admin-uploaded images silently 404 everywhere else. Object
 * storage gives every environment the same URL.
 *
 * Production env:
 *   CLOUDINARY_CLOUD_NAME=...
 *   CLOUDINARY_API_KEY=...
 *   CLOUDINARY_API_SECRET=...        (server-only — never expose to the client)
 *   CLOUDINARY_FOLDER=properties     (optional, defaults to "properties")
 */
import { createHash } from "node:crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const API_KEY = process.env.CLOUDINARY_API_KEY?.trim();
const API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim();
const FOLDER = process.env.CLOUDINARY_FOLDER?.trim() || "properties";

export function isConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

/**
 * Cloudinary signs requests with SHA-1 over the alphabetically sorted params
 * that are actually sent, excluding `file`, `api_key` and `resource_type`.
 */
function sign(params: Record<string, string>, secret: string): string {
  const canonical = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(canonical + secret).digest("hex");
}

/**
 * Uploads an image and returns its permanent https URL.
 *
 * `publicId` should not carry a file extension — Cloudinary derives the format
 * and appends it to the delivery URL.
 */
export async function uploadImage(file: File, publicId: string): Promise<string> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error("Cloudinary is not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signed = { folder: FOLDER, public_id: publicId, timestamp };

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", API_KEY);
  body.append("folder", FOLDER);
  body.append("public_id", publicId);
  body.append("timestamp", timestamp);
  body.append("signature", sign(signed, API_SECRET));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new Error("Cloudinary upload returned no secure_url");
  }
  return data.secure_url;
}
