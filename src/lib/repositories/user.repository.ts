import { prisma } from "@/lib/db/prisma";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  provider: string;
  savedPropertyIds: string[];
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  provider: string;
  passwordHash: string | null;
  savedPropertyIds: string[];
};

const toRecord = (u: UserRow): UserRecord => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phoneNumber: u.phoneNumber ?? null,
  provider: u.provider,
  savedPropertyIds: u.savedPropertyIds ?? [],
});

export const userRepository = {
  async findById(id: string): Promise<UserRecord | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    return u ? toRecord(u) : null;
  },

  /** Full row incl. passwordHash — for login credential checks only. */
  async findByEmail(email: string): Promise<UserRow | null> {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  async create(input: {
    name: string;
    email: string;
    phoneNumber?: string | null;
    passwordHash?: string | null;
    provider?: string;
  }): Promise<UserRecord> {
    const u = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        phoneNumber: input.phoneNumber ?? null,
        passwordHash: input.passwordHash ?? null,
        provider: input.provider ?? "email",
      },
    });
    return toRecord(u);
  },

  async setSavedPropertyIds(
    id: string,
    savedPropertyIds: string[],
  ): Promise<UserRecord> {
    const u = await prisma.user.update({
      where: { id },
      data: { savedPropertyIds },
    });
    return toRecord(u);
  },

  async setResetToken(
    id: string,
    resetTokenHash: string,
    resetTokenExp: Date,
  ): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { resetTokenHash, resetTokenExp },
    });
  },

  async findByResetTokenHash(
    resetTokenHash: string,
  ): Promise<{ id: string; resetTokenExp: Date | null } | null> {
    return prisma.user.findFirst({
      where: { resetTokenHash },
      select: { id: true, resetTokenExp: true },
    });
  },

  /** Sets a new password and clears the one-time reset token. */
  async updatePassword(id: string, passwordHash: string): Promise<UserRecord> {
    const u = await prisma.user.update({
      where: { id },
      data: { passwordHash, resetTokenHash: null, resetTokenExp: null },
    });
    return toRecord(u);
  },
};
