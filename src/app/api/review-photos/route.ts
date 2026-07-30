import type { NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSessionUserId } from "@/lib/auth/session";
import { AppError, UnauthorizedError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { handleError, json } from "@/lib/api/http";
import { isConfigured, uploadImage } from "@/lib/storage/cloudinary";
import {
  extensionFor,
  REVIEW_PHOTO_DIR,
  REVIEW_PHOTO_URL_PREFIX,
} from "@/lib/storage/review-photo-store";
import { REVIEW_PHOTO_MAX_MB } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/review-photos — one photo for a review, from a signed-in visitor.
 *
 * Separate from `/api/admin/upload`, which requires an admin session. This is
 * the only endpoint in the app that accepts a file from a non-admin, so it is
 * deliberately tight: session required, three MIME types (no GIF), 5MB (half
 * the admin cap), and a per-IP rate limit so it cannot be used to fill the disk
 * or burn through the Cloudinary quota.
 *
 * The filename is generated, never taken from the upload — a caller-controlled
 * name is a path-traversal risk and can collide with an existing file.
 */
export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, {
      name: "reviews:photo",
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    const userId = getSessionUserId();
    if (!userId) {
      throw new UnauthorizedError("Please sign in to upload photos.");
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new AppError("No file provided", 400);

    const ext = extensionFor(file.type);
    if (!ext) {
      throw new AppError("Only JPG, PNG and WebP images are allowed", 400);
    }
    if (file.size / (1024 * 1024) > REVIEW_PHOTO_MAX_MB) {
      throw new AppError(`Each photo must be under ${REVIEW_PHOTO_MAX_MB}MB`, 400);
    }
    if (file.size === 0) throw new AppError("That file is empty", 400);

    const stem = `review-${randomUUID()}`;

    if (isConfigured()) {
      return json({ url: await uploadImage(file, stem) });
    }

    // Local-disk fallback. Written outside public/ and served back through
    // GET /api/review-photos/[name], because a production build only serves the
    // public/ files that existed when it was built.
    const name = `${stem}.${ext}`;
    await mkdir(REVIEW_PHOTO_DIR, { recursive: true });
    await writeFile(
      path.join(REVIEW_PHOTO_DIR, name),
      Buffer.from(await file.arrayBuffer()),
    );
    return json({ url: `${REVIEW_PHOTO_URL_PREFIX}${name}` });
  } catch (err) {
    return handleError(err);
  }
}
