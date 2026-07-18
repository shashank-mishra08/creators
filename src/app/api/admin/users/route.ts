import { requireRole } from "@/lib/auth/roles";
import { adminUserService } from "@/lib/services/admin-user.service";
import { logAction } from "@/lib/services/audit.service";
import { handleError, json, parseJsonBody } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/users — list admin-panel users (Super Admin only). */
export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");
    const users = await adminUserService.list();
    return json({ users });
  } catch (err) {
    return handleError(err);
  }
}

/** POST /api/admin/users — invite a new admin user (Super Admin only). */
export async function POST(req: Request) {
  try {
    const actor = await requireRole("SUPER_ADMIN");
    const body = (await parseJsonBody(req as Parameters<typeof parseJsonBody>[0])) as {
      name?: string;
      email?: string;
      role?: string;
    };
    const origin = new URL(req.url).origin;
    const { user, inviteUrl } = await adminUserService.invite(
      { name: body.name ?? "", email: body.email ?? "", role: body.role ?? "" },
      origin,
    );
    await logAction({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "user.invite",
      entity: "user",
      entityId: user.id,
      summary: `Invited ${user.email} as ${user.role}`,
    });
    return json({ user, inviteUrl }, 201);
  } catch (err) {
    return handleError(err);
  }
}
