import type { NextRequest } from "next/server";
import { propertyService } from "@/lib/services/property.service";
import { handleError, json } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/properties/:id */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    return json(await propertyService.getByIdOrThrow(params.id));
  } catch (err) {
    return handleError(err);
  }
}
