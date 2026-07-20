import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Single PrismaClient instance (Prisma 7 + pg driver adapter).
 *
 * Prisma 7 connects through a driver adapter rather than a bundled engine; we
 * use `@prisma/adapter-pg` against `DATABASE_URL`. Cached on `globalThis` so
 * Next.js hot-reload in dev doesn't open a new pool on every change.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and configure it.",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createClient();
    }
    return (globalForPrisma.prisma as any)[prop];
  }
});

if (process.env.NODE_ENV !== "production") {
  // Ensure we don't accidentally instantiate during hot reloads unless already instantiated
  // But globalForPrisma is already handling the persistence.
}
