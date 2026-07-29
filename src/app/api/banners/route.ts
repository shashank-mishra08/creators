import { bannerService } from "@/lib/services/banner.service";
import { handleError, json } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/banners — active, in-window banners for the public site. */
export async function GET() {
  try {
    return json(await bannerService.live());
  } catch (err) {
    return handleError(err);
  }
}
