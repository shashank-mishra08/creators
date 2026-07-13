import { builderService } from "@/lib/services/builder.service";
import { handleError, json } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/builders — all builders with property counts. */
export async function GET() {
  try {
    return json(await builderService.list());
  } catch (err) {
    return handleError(err);
  }
}
