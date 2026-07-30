import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  contentTypeFor,
  isSafePhotoName,
  REVIEW_PHOTO_DIR,
} from "@/lib/storage/review-photo-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/review-photos/:name — serves a locally stored review photo.
 *
 * Needed because a production build only serves the `public/` files that
 * existed when it was built, so an uploaded file would 404 until the next
 * restart. Reading from disk per request avoids that entirely.
 *
 * Only generated names pass `isSafePhotoName`, so `name` can never escape the
 * upload directory or address anything but an image this app wrote.
 */
export async function GET(
  _req: Request,
  { params }: { params: { name: string } },
) {
  const { name } = params;
  if (!isSafePhotoName(name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await readFile(path.join(REVIEW_PHOTO_DIR, name));
    return new NextResponse(file, {
      headers: {
        "content-type": contentTypeFor(name),
        // Immutable: the name contains a UUID, so a given URL is one exact file.
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
