import type { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { handleError, json } from "@/lib/api/http";
import { AppError } from "@/lib/errors";
import { isConfigured, uploadImage } from "@/lib/storage/cloudinary";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_MB = 10;

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
    await requireAdminSession();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new AppError("No file provided", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      throw new AppError("Only JPEG, PNG, WebP, and GIF files are allowed", 400);
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      throw new AppError(`File too large. Maximum size is ${MAX_SIZE_MB}MB`, 400);
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
      const url = await uploadImage(file, stem);
      return json({ path: url, filename });
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
