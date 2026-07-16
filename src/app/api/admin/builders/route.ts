import { requireAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { handleError, json } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/builders — list all builders for the Add Property form dropdown */
export async function GET() {
  try {
    await requireAdminSession();
    const builders = await prisma.builder.findMany({
      select: { id: true, name: true, rating: true, logoColor: true },
      orderBy: { name: "asc" },
    });
    return json(builders);
  } catch (err) {
    return handleError(err);
  }
}
