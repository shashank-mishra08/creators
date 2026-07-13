import type { NextRequest } from "next/server";
import { comparisonService } from "@/lib/services/comparison.service";
import { compareSchema } from "@/lib/validation/schemas";
import { collectParams, handleError, json } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/compare?id=<a>&id=<b>[&id=<c>&id=<d>]
 * Returns { result, properties, similar } — the structured comparison payload
 * (also the shape an AI scoring service consumes; see /api/ai/compare).
 */
export async function GET(req: NextRequest) {
  try {
    const ids = collectParams(req.nextUrl.searchParams, "id", "ids");
    const { ids: validIds } = compareSchema.parse({ ids });
    return json(await comparisonService.compare(validIds));
  } catch (err) {
    return handleError(err);
  }
}
