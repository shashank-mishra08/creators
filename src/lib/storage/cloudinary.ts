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

/**
 * Read on each call rather than once at module load.
 *
 * A standalone script loads .env in its own body, but ES modules evaluate every
 * static import first — so module-level reads here happened before dotenv had
 * run, and `isConfigured()` returned false with perfectly good credentials in
 * .env. Next.js loads env before any app module, so the app never saw it; the
 * migration script would have refused to run. Reading lazily costs nothing and
 * removes the ordering trap for every caller.
 */
function env() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    apiKey: process.env.CLOUDINARY_API_KEY?.trim(),
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
    folder: process.env.CLOUDINARY_FOLDER?.trim() || "properties",
  };
}

export function isConfigured(): boolean {
  const { cloudName, apiKey, apiSecret } = env();
  return Boolean(cloudName && apiKey && apiSecret);
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
  return upload(file, publicId, "image");
}

/**
 * Uploads a video and returns its permanent https URL.
 *
 * Cloudinary keeps videos on a different resource path from images, and an
 * upload sent to the image endpoint is rejected rather than converted — hence a
 * second entry point rather than a flag on the first.
 */
export async function uploadVideo(file: File, publicId: string): Promise<string> {
  return upload(file, publicId, "video");
}

async function upload(
  file: File,
  publicId: string,
  resourceType: "image" | "video",
): Promise<string> {
  const { cloudName, apiKey, apiSecret, folder } = env();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signed = { folder, public_id: publicId, timestamp };

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("folder", folder);
  body.append("public_id", publicId);
  body.append("timestamp", timestamp);
  body.append("signature", sign(signed, apiSecret));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
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
