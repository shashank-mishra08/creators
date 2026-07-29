import type { NextRequest } from "next/server";
import { propertyService } from "@/lib/services/property.service";
import { propertyFiltersSchema } from "@/lib/validation/schemas";
import { collectParams, handleError, json } from "@/lib/api/http";
import type { PropertyFilters } from "@/lib/data-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/properties
 *   ?ids=a,b,c            → fetch specific properties (order preserved)
 *   ?slim=1               → minimal rows for pickers (id/name/builder/image…)
 *   ?city=&kind=&builder=&possession=&maxPriceLakh=&query=  → filtered list
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;

    const ids = collectParams(params, "ids", "id");
    if (ids.length > 0) {
      return json(await propertyService.getByIds(ids));
    }

    // Checked before filter parsing: pickers want the whole catalogue, and the
    // slim payload is a different shape from the full `Property` list.
    if (params.get("slim") === "1") {
      return json(await propertyService.options());
    }

    const parsed = propertyFiltersSchema.parse(
      Object.fromEntries(params.entries()),
    );
    return json(await propertyService.list(parsed as PropertyFilters));
  } catch (err) {
    return handleError(err);
  }
}
