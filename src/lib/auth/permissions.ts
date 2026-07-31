import type { Role } from "@/lib/auth/roles";

/**
 * What each admin role is allowed to do.
 *
 * Deliberately a plain table in code rather than rows in the database. It is
 * the answer to "who can do what", so it should be readable in a diff and
 * reviewable before it ships — a matrix stored in the database hides a mistake
 * until someone exercises it. Making it editable later means changing where
 * this table comes from; every caller already goes through `can()`.
 *
 * Pure on purpose: no prisma, no session, no server-only imports. The admin UI
 * imports this to decide which buttons to render, and the API guard
 * (`requirePermission` in ./roles) imports it to decide what to allow. One
 * table, so the two can never disagree.
 *
 * The UI check is a courtesy — hiding a button is not security. The API guard
 * is the boundary that actually holds.
 */

/** A thing in the admin panel, as an admin would name it. */
export type Resource =
  | "properties"
  | "trash" // the Recently Deleted bucket
  | "banners"
  | "import"
  | "enquiries"
  | "users"
  | "settings"
  | "audit";

/**
 * `delete` sends a property to the trash and is reversible.
 * `purge` destroys it and is not — they are separate on purpose, so "can edit"
 * never quietly means "can destroy".
 */
export type Action =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "restore"
  | "purge"
  | "run"; // import only

/**
 * Restrictions for the non-super roles. Super Admin is not listed: it passes
 * everything by rule in `can()`, so a typo here can never lock the owner out of
 * their own panel.
 */
const PERMISSIONS: Record<"MANAGER" | "AGENT" | "CUSTOMER", Partial<Record<Resource, readonly Action[]>>> = {
  MANAGER: {
    properties: ["view", "create", "edit", "delete"],
    // Can undo a delete, cannot make one permanent.
    trash: ["view", "restore"],
    banners: ["view", "create", "edit", "delete"],
    import: ["run"],
    enquiries: ["view", "edit"],
    settings: ["view"],
  },
  AGENT: {
    // A salesperson: reads the catalogue, works the enquiries, breaks nothing.
    properties: ["view"],
    banners: ["view"],
    enquiries: ["view", "edit"],
  },
  CUSTOMER: {},
};

/** Can this role perform `action` on `resource`? */
export function can(role: Role, resource: Resource, action: Action): boolean {
  // The owner of the panel always passes. Keeps a mistake in the table above
  // from being able to lock out the one account that could repair it.
  if (role === "SUPER_ADMIN") return true;
  const allowed = PERMISSIONS[role]?.[resource];
  return Array.isArray(allowed) && allowed.includes(action);
}

/** Does this role have any access at all to `resource`? Used to build menus. */
export function canSee(role: Role, resource: Resource): boolean {
  return can(role, resource, "view") || can(role, resource, "run");
}
