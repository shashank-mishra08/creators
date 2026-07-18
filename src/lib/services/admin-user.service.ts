import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { sendEmail, adminInviteEmail, passwordResetEmail } from "@/lib/email";
import { ADMIN_ROLES, ROLE_LABELS, type Role } from "@/lib/auth/roles";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_TTL_MS = 60 * 60 * 1000; // 1 hour
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Roles an admin can be assigned from the UI (CUSTOMER is website-only). */
export const ASSIGNABLE_ROLES: readonly Role[] = ["SUPER_ADMIN", "MANAGER", "AGENT"];

function assertAssignable(role: string): asserts role is Role {
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
    throw new AppError("Invalid role.", 400);
  }
}

/** isAdmin is kept in sync with role so the existing isAdmin-based guard stays correct. */
const roleIsAdmin = (role: Role) => (ADMIN_ROLES as readonly string[]).includes(role);

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  invitedAt: string | null;
  createdAt: string;
  hasPassword: boolean; // false = invited but hasn't set a password yet
}

const ADMIN_FILTER = {
  OR: [{ isAdmin: true }, { role: { in: ADMIN_ROLES as unknown as string[] } }],
};

const toRow = (u: {
  id: string; name: string; email: string; role: string; isActive: boolean;
  lastLoginAt: Date | null; invitedAt: Date | null; createdAt: Date; passwordHash: string | null;
}): AdminUserRow => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role as Role,
  isActive: u.isActive,
  lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  invitedAt: u.invitedAt?.toISOString() ?? null,
  createdAt: u.createdAt.toISOString(),
  hasPassword: !!u.passwordHash,
});

const SELECT = {
  id: true, name: true, email: true, role: true, isActive: true, isAdmin: true,
  lastLoginAt: true, invitedAt: true, createdAt: true, passwordHash: true,
} as const;

export const adminUserService = {
  /** All admin-panel users (never public customers). */
  async list(): Promise<AdminUserRow[]> {
    const users = await prisma.user.findMany({
      where: ADMIN_FILTER,
      orderBy: { createdAt: "asc" },
      select: SELECT,
    });
    return users.map(toRow);
  },

  /**
   * Create a new admin user and email them a set-password (invite) link.
   * Reuses the existing password-reset token machinery. If the email already
   * belongs to any account we refuse, to avoid silently promoting a customer.
   */
  async invite(
    input: { name: string; email: string; role: string },
    origin: string,
  ): Promise<{ user: AdminUserRow; inviteUrl: string }> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name) throw new AppError("Name is required.", 400);
    if (!EMAIL_RE.test(email)) throw new AppError("Enter a valid email address.", 400);
    assertAssignable(input.role);

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new AppError("An account with this email already exists.", 409);

    const token = randomBytes(32).toString("hex");
    const exp = new Date(Date.now() + INVITE_TTL_MS);

    const created = await prisma.user.create({
      data: {
        name,
        email,
        role: input.role,
        isAdmin: roleIsAdmin(input.role),
        isActive: true,
        provider: "email",
        passwordHash: null,
        invitedAt: new Date(),
        resetTokenHash: sha256(token),
        resetTokenExp: exp,
      },
      select: SELECT,
    });

    const url = `${origin}/reset-password?token=${token}`;
    const { subject, html } = adminInviteEmail(url, {
      name,
      roleLabel: ROLE_LABELS[input.role],
    });
    // Best-effort: send the email if configured, but never fail the invite on
    // it — the caller also gets the link back to share manually.
    await sendEmail({ to: email, subject, html }).catch(() => {});
    console.log(`[admin] invite link for ${email}: ${url}`);

    return { user: toRow(created), inviteUrl: url };
  },

  /**
   * Generate a fresh set-password link for an EXISTING admin user (e.g. they
   * forgot their password or the invite expired). Emails it if configured and
   * returns the link so a Super Admin can share it manually.
   */
  async createResetLink(
    id: string,
    origin: string,
  ): Promise<{ user: AdminUserRow; resetUrl: string }> {
    const target = await prisma.user.findUnique({ where: { id }, select: SELECT });
    if (!target) throw new AppError("User not found.", 404);
    const targetIsAdminUser =
      target.isAdmin || (ADMIN_ROLES as readonly string[]).includes(target.role);
    if (!targetIsAdminUser) throw new AppError("User not found.", 404);

    const token = randomBytes(32).toString("hex");
    const exp = new Date(Date.now() + INVITE_TTL_MS);
    const updated = await prisma.user.update({
      where: { id },
      data: { resetTokenHash: sha256(token), resetTokenExp: exp },
      select: SELECT,
    });

    const url = `${origin}/reset-password?token=${token}`;
    const { subject, html } = passwordResetEmail(url);
    await sendEmail({ to: updated.email, subject, html }).catch(() => {});
    console.log(`[admin] reset link for ${updated.email}: ${url}`);

    return { user: toRow(updated), resetUrl: url };
  },

  /**
   * Update a user's role and/or active status. Guards against a Super Admin
   * locking themselves out or removing the last remaining active Super Admin.
   */
  async update(
    id: string,
    actorId: string,
    patch: { role?: string; isActive?: boolean },
  ): Promise<AdminUserRow> {
    const target = await prisma.user.findUnique({ where: { id }, select: SELECT });
    if (!target) throw new AppError("User not found.", 404);

    // Only manage admin-panel users here — never touch public customers.
    const targetIsAdminUser =
      target.isAdmin || (ADMIN_ROLES as readonly string[]).includes(target.role);
    if (!targetIsAdminUser) throw new AppError("User not found.", 404);

    const nextRole = (patch.role ?? target.role) as Role;
    if (patch.role !== undefined) assertAssignable(patch.role);
    const nextActive = patch.isActive ?? target.isActive;

    // A Super Admin cannot demote or deactivate themselves (prevents lockout).
    if (id === actorId) {
      if (nextRole !== "SUPER_ADMIN") {
        throw new AppError("You can't change your own role.", 400);
      }
      if (nextActive === false) {
        throw new AppError("You can't deactivate your own account.", 400);
      }
    }

    // Never leave zero active Super Admins.
    const losingSuperAdmin =
      target.role === "SUPER_ADMIN" && (nextRole !== "SUPER_ADMIN" || nextActive === false);
    if (losingSuperAdmin) {
      const otherActiveSupers = await prisma.user.count({
        where: { role: "SUPER_ADMIN", isActive: true, id: { not: id } },
      });
      if (otherActiveSupers === 0) {
        throw new AppError("At least one active Super Admin is required.", 400);
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: nextRole,
        isAdmin: roleIsAdmin(nextRole),
        isActive: nextActive,
      },
      select: SELECT,
    });
    return toRow(updated);
  },
};
