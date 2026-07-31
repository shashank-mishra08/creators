"use client";

import * as React from "react";
import { can, type Action, type Resource } from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/roles";

/**
 * The signed-in admin's role, for the client pages.
 *
 * The layout already resolves it server-side; this carries it down so a page
 * can ask the same permission table the API enforces, instead of hardcoding a
 * role name next to every button.
 *
 * Hiding a control is not a security boundary — the API guard is. This exists
 * so the panel does not offer actions that would come back 403.
 */
const AdminRoleContext = React.createContext<Role | null>(null);

export function AdminRoleProvider({
  role,
  children,
}: {
  role?: string;
  children: React.ReactNode;
}) {
  const value = (role as Role) ?? null;
  return <AdminRoleContext.Provider value={value}>{children}</AdminRoleContext.Provider>;
}

/**
 * `allowed(resource, action)` for the current admin.
 *
 * Fails OPEN when no role is in context — a page rendered outside the provider
 * keeps the buttons it always had rather than silently losing them. The API
 * still refuses anything the role may not do.
 */
export function useCan(): (resource: Resource, action: Action) => boolean {
  const role = React.useContext(AdminRoleContext);
  return React.useCallback(
    (resource: Resource, action: Action) => (role ? can(role, resource, action) : true),
    [role],
  );
}
