import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { can, type Action, type Resource } from "@/lib/auth/permissions";

/**
 * Role-based access control for the admin panel.
 *
 * IMPORTANT: this is ADDITIVE. The existing `requireAdminSession()` (which gates
 * every pre-existing admin route on `isAdmin`) is left completely untouched.
 * This module is used only by the NEW admin routes (users, settings, audit) that
 * need finer-grained checks. An account is "admin-capable" if `isAdmin` is true
 * OR its role is one of the admin roles — existing admins (backfilled to
 * SUPER_ADMIN) satisfy both, so nothing about current access changes.
 */

export type Role = "SUPER_ADMIN" | "MANAGER" | "AGENT" | "CUSTOMER";

export const ADMIN_ROLES: readonly Role[] = ["SUPER_ADMIN", "MANAGER", "AGENT"];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  AGENT: "Agent",
  CUSTOMER: "Customer",
};

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isAdmin: boolean;
  isActive: boolean;
}

function isAdminCapable(u: { isAdmin: boolean; role: string }): boolean {
  return u.isAdmin || (ADMIN_ROLES as readonly string[]).includes(u.role);
}

/**
 * Resolve the currently signed-in admin, or null if not signed in / not an
 * admin / deactivated. Never throws — safe to call from server components (e.g.
 * the admin layout) to decide what to render.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const userId = getSessionUserId();
  if (!userId) return null;

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isAdmin: true, isActive: true },
  });

  if (!u || !u.isActive || !isAdminCapable(u)) return null;

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Role,
    isAdmin: u.isAdmin,
    isActive: u.isActive,
  };
}

/**
 * Guard for admin API routes. Ensures the caller is authenticated, active, and
 * admin-capable; if `allowed` roles are given, also enforces membership.
 * Throws 401 (not signed in) / 403 (not admin, deactivated, or wrong role).
 */
export async function requireRole(...allowed: Role[]): Promise<AdminUser> {
  const userId = getSessionUserId();
  if (!userId) throw new AppError("Not authenticated. Please log in.", 401);

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isAdmin: true, isActive: true },
  });

  if (!u) throw new AppError("Not authenticated. Please log in.", 401);
  if (!u.isActive) throw new AppError("Your account has been deactivated.", 403);
  if (!isAdminCapable(u)) throw new AppError("Access denied. Admin privileges required.", 403);

  const role = u.role as Role;
  if (allowed.length > 0 && !allowed.includes(role)) {
    throw new AppError("You don't have permission to perform this action.", 403);
  }

  return { id: u.id, name: u.name, email: u.email, role, isAdmin: u.isAdmin, isActive: u.isActive };
}

/**
 * Guard for admin API routes, stated as the thing being done rather than the
 * roles allowed to do it: `requirePermission("properties", "delete")` reads as
 * the rule it enforces, and adding a role later means editing the permission
 * table, not hunting for every route that named that role.
 *
 * Also closes a gap the older `requireAdminSession()` left open: that one
 * checks `isAdmin` and nothing else, so a deactivated admin kept working on
 * every route using it. This refuses a deactivated account.
 *
 * Throws 401 (not signed in) or 403 (deactivated, not an admin, or not
 * permitted).
 */
export async function requirePermission(
  resource: Resource,
  action: Action,
): Promise<AdminUser> {
  const admin = await requireRole();
  if (!can(admin.role, resource, action)) {
    throw new AppError("You don't have permission to perform this action.", 403);
  }
  return admin;
}
