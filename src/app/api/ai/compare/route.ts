import type { NextRequest } from "next/server";
import { aiService } from "@/lib/services/ai.service";
import { compareSchema } from "@/lib/validation/schemas";
import { collectParams, handleError, json } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ai/compare?id=<a>&id=<b>
 * Returns the AI-ready context: per-property numeric feature vectors + the
 * current rule-based result. A future AI service consumes this without touching
 * the database layer. (No model is implemented yet — see ai.service.ts.)
 */
export async function GET(req: NextRequest) {
  try {
    const ids = collectParams(req.nextUrl.searchParams, "id", "ids");
    const { ids: validIds } = compareSchema.parse({ ids });
    return json(await aiService.buildComparisonContext(validIds));
  } catch (err) {
    return handleError(err);
  }
}
