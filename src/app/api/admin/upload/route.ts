import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { can } from "@/lib/auth/permissions";
import { handleError, json } from "@/lib/api/http";
import { AppError } from "@/lib/errors";
import { isConfigured, uploadImage, uploadVideo } from "@/lib/storage/cloudinary";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
/** Property walkthrough clips. QuickTime is what a phone records. */
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_SIZE_MB = 10;
/**
 * Videos are bigger, but not unlimited: the file crosses a serverless function
 * on its way to Cloudinary, so a very large one fails at the platform rather
 * than here. Anything longer than a short tour belongs on YouTube, and the URL
 * field beside the upload button takes that.
 */
const MAX_VIDEO_SIZE_MB = 50;

/**
 * POST /api/admin/upload
 * Accepts a single file via multipart/form-data and returns the URL to store
 * on the media row.
 *
 * With Cloudinary credentials set, the file goes to object storage and the
 * returned URL works from every environment. Without them we fall back to
 * writing into public/properties/, which only serves from the machine that
 * received the upload — fine for local dev, broken once deployed.
 */
export async function POST(req: NextRequest) {
  try {
    // Shared by the property form and the banner form, so it cannot belong to
    // one resource: whoever may edit either may put a picture on it.
    const admin = await requireRole();
    if (!can(admin.role, "properties", "edit") && !can(admin.role, "banners", "edit")) {
      throw new AppError("You don't have permission to upload files.", 403);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new AppError("No file provided", 400);
    }

    const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);
    if (!isVideo && !ALLOWED_TYPES.has(file.type)) {
      throw new AppError(
        "Allowed files: JPEG, PNG, WebP, GIF images, or MP4, WebM, MOV video",
        400,
      );
    }

    const limitMB = isVideo ? MAX_VIDEO_SIZE_MB : MAX_SIZE_MB;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > limitMB) {
      throw new AppError(
        isVideo
          ? `Video too large (${sizeMB.toFixed(0)}MB). Maximum is ${limitMB}MB — for anything bigger, upload it to YouTube and paste the link instead.`
          : `File too large. Maximum size is ${limitMB}MB`,
        400,
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeName = file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const stem = `${safeName}-${Date.now()}`;
    const filename = `${stem}.${ext}`;

    if (isConfigured()) {
      const url = isVideo
        ? await uploadVideo(file, stem)
        : await uploadImage(file, stem);
      return json({ path: url, filename });
    }

    if (isVideo) {
      // The image fallback writes into public/, which does not survive a
      // redeploy. Silently doing that with a 50MB video would look like it
      // worked and then lose the file.
      throw new AppError(
        "Video upload needs Cloudinary storage, which is not configured here. Paste a video URL instead.",
        503,
      );
    }

    console.warn(
      "[upload] Cloudinary not configured — writing to public/properties/. " +
        "This file will not be visible on other machines or after a redeploy.",
    );

    const dir = path.join(process.cwd(), "public", "properties");
    await mkdir(dir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(dir, filename), buffer);

    return json({ path: `/properties/${filename}`, filename });
  } catch (err) {
    return handleError(err);
  }
}
