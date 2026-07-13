import { randomBytes, createHash } from "node:crypto";
import { userRepository, type UserRecord } from "@/lib/repositories/user.repository";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { AppError } from "@/lib/errors";

/** Public-safe user (never expose passwordHash). */
export type SafeUser = UserRecord;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

const MIN_PASSWORD = 8;
// Upper bound guards against very long inputs making scrypt a CPU DoS vector.
const MAX_PASSWORD = 200;

/** Shared password policy for signup and reset. Throws a 400 on failure. */
function assertPasswordPolicy(password: string): void {
  if (password.length < MIN_PASSWORD)
    throw new AppError(
      `Password must be at least ${MIN_PASSWORD} characters.`,
      400,
    );
  if (password.length > MAX_PASSWORD)
    throw new AppError(
      `Password must be at most ${MAX_PASSWORD} characters.`,
      400,
    );
}

/**
 * Validate + canonicalise an Indian mobile number. Accepts an optional +91 /
 * 91 / leading-0 and any spaces or dashes, then stores the 10-digit local form
 * (must start 6–9). Throws a 400 on anything else.
 */
function normalizePhone(phone: string): string {
  let local = phone.replace(/[^\d]/g, "");
  if (local.length === 12 && local.startsWith("91")) local = local.slice(2);
  else if (local.length === 11 && local.startsWith("0")) local = local.slice(1);
  if (!/^[6-9]\d{9}$/.test(local))
    throw new AppError("Enter a valid 10-digit Indian mobile number.", 400);
  return local;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export const authService = {
  async signup(
    name: string,
    email: string,
    phone: string,
    password: string,
  ): Promise<SafeUser> {
    const cleanName = name.trim();
    const mail = email.trim().toLowerCase();
    if (!cleanName || !mail || !phone || !password) {
      throw new AppError("Please fill in every field.", 400);
    }
    if (!EMAIL_RE.test(mail)) throw new AppError("Enter a valid email address.", 400);
    const phoneNumber = normalizePhone(phone);
    assertPasswordPolicy(password);

    const existing = await userRepository.findByEmail(mail);
    if (existing)
      throw new AppError("An account with this email already exists.", 409);

    return userRepository.create({
      name: cleanName,
      email: mail,
      phoneNumber,
      passwordHash: hashPassword(password),
      provider: "email",
    });
  },

  async login(email: string, password: string): Promise<SafeUser> {
    const mail = email.trim().toLowerCase();
    const row = await userRepository.findByEmail(mail);
    if (!row || !verifyPassword(password, row.passwordHash)) {
      throw new AppError("Invalid email or password.", 401);
    }
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phoneNumber: row.phoneNumber ?? null,
      provider: row.provider,
      savedPropertyIds: row.savedPropertyIds ?? [],
    };
  },

  async me(userId: string): Promise<SafeUser | null> {
    return userRepository.findById(userId);
  },

  /** Toggle a property in the user's saved list; returns the updated list. */
  async toggleSaved(userId: string, propertyId: string): Promise<string[]> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Not signed in.", 401);
    const cur = user.savedPropertyIds;
    const next = cur.includes(propertyId)
      ? cur.filter((x) => x !== propertyId)
      : [...cur, propertyId];
    const updated = await userRepository.setSavedPropertyIds(userId, next);
    return updated.savedPropertyIds;
  },

  /**
   * Start a password reset. Always resolves the same way (never reveals whether
   * the email exists). If the account exists, stores a hashed one-time token and
   * emails a reset link (also logged server-side for dev/no-email setups).
   */
  async requestPasswordReset(email: string, origin: string): Promise<void> {
    const mail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(mail)) return; // ignore invalid input silently
    const user = await userRepository.findByEmail(mail);
    if (!user) return;

    const token = randomBytes(32).toString("hex");
    const exp = new Date(Date.now() + RESET_TTL_MS);
    await userRepository.setResetToken(user.id, sha256(token), exp);

    const url = `${origin}/reset-password?token=${token}`;
    const { subject, html } = passwordResetEmail(url);
    await sendEmail({ to: mail, subject, html });
    console.log(`[auth] password reset link for ${mail}: ${url}`);
  },

  /** Complete a reset: validate the token, set a new password, sign the user in. */
  async resetPassword(token: string, newPassword: string): Promise<SafeUser> {
    if (!token) throw new AppError("Invalid or expired reset link.", 400);
    assertPasswordPolicy(newPassword);

    const row = await userRepository.findByResetTokenHash(sha256(token));
    if (!row || !row.resetTokenExp || row.resetTokenExp.getTime() < Date.now()) {
      throw new AppError("This reset link is invalid or has expired.", 400);
    }
    return userRepository.updatePassword(row.id, hashPassword(newPassword));
  },
};
