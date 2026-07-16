const { PrismaClient } = require('@prisma/client');
const { scryptSync, randomBytes } = require('crypto');

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function run() {
  const prisma = new PrismaClient();
  const passwordHash = hashPassword('Admin@123');
  
  await prisma.user.upsert({
    where: { email: 'admin@creatorshome.in' },
    update: { passwordHash },
    create: {
      name: 'Admin',
      email: 'admin@creatorshome.in',
      passwordHash,
      provider: 'email',
    }
  });
  console.log('Password reset successfully to Admin@123');
}

run().catch(console.error).finally(() => process.exit(0));
