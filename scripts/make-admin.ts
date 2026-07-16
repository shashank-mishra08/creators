/**
 * One-time script: sets isAdmin=true for the admin email(s) listed in ADMIN_EMAILS.
 * Run: npx tsx scripts/make-admin.ts
 *
 * ADMIN_EMAILS in .env can be comma-separated: admin1@example.com,admin2@example.com
 */
import "dotenv/config";
import { prisma } from "@/lib/db/prisma";

async function main() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (emails.length === 0) {
    console.error(
      "No emails found. Set ADMIN_EMAILS=admin@example.com in your .env file."
    );
    process.exit(1);
  }

  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`⚠  User not found: ${email} — create an account first via the website.`);
      continue;
    }
    if (user.isAdmin) {
      console.log(`✓  Already admin: ${email}`);
      continue;
    }
    await prisma.user.update({ where: { email }, data: { isAdmin: true } });
    console.log(`✅  Granted admin: ${email}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
