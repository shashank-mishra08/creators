import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

async function run() {
  const passwordHash = hashPassword("Admin@123");
  
  await prisma.user.upsert({
    where: { email: "admin@creatorshome.in" },
    update: { passwordHash, isAdmin: true, role: "SUPER_ADMIN", isActive: true },
    create: {
      name: "Admin",
      email: "admin@creatorshome.in",
      passwordHash,
      provider: "email",
      isAdmin: true,
      role: "SUPER_ADMIN",
      isActive: true,
    }
  });
  console.log("Password reset to Admin@123; isAdmin + SUPER_ADMIN role set, account active.");
}

run().catch(console.error).finally(() => process.exit(0));
