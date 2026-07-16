import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

async function run() {
  const passwordHash = hashPassword("Admin@123");
  
  await prisma.user.upsert({
    where: { email: "admin@creatorshome.in" },
    update: { passwordHash, isAdmin: true },
    create: {
      name: "Admin",
      email: "admin@creatorshome.in",
      passwordHash,
      provider: "email",
      isAdmin: true,
    }
  });
  console.log("Password reset successfully to Admin@123 and isAdmin set to true");
}

run().catch(console.error).finally(() => process.exit(0));
