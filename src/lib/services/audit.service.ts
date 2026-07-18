import { prisma } from "@/lib/db/prisma";

/**
 * Append-only audit log. `logAction` is BEST-EFFORT and never throws — callers
 * can `await` it without risk of breaking the request it accompanies. If actor
 * name/role are omitted they are resolved from the actorId (also best-effort).
 */

export interface AuditEntry {
  actorId?: string | null;
  actorName?: string;
  actorRole?: string;
  action: string; // e.g. "user.invite", "settings.update", "property.hide"
  entity?: string;
  entityId?: string;
  summary?: string;
}

export async function logAction(entry: AuditEntry): Promise<void> {
  try {
    let actorName = entry.actorName;
    let actorRole = entry.actorRole;
    if ((!actorName || !actorRole) && entry.actorId) {
      const u = await prisma.user.findUnique({
        where: { id: entry.actorId },
        select: { name: true, role: true },
      });
      actorName = actorName ?? u?.name ?? "";
      actorRole = actorRole ?? u?.role ?? "";
    }
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        actorName: actorName ?? "",
        actorRole: actorRole ?? "",
        action: entry.action,
        entity: entry.entity ?? "",
        entityId: entry.entityId ?? "",
        summary: entry.summary ?? "",
      },
    });
  } catch (err) {
    console.error("[audit] failed to log (non-fatal)", err);
  }
}

export interface AuditRow {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  summary: string;
  createdAt: string;
}

export async function listRecentAudit(limit = 200): Promise<AuditRow[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
  });
  return rows.map((r) => ({
    id: r.id,
    actorName: r.actorName || "System",
    actorRole: r.actorRole,
    action: r.action,
    entity: r.entity,
    summary: r.summary,
    createdAt: r.createdAt.toISOString(),
  }));
}
