/**
 * Seed script — creates the initial admin account.
 *
 * Usage:
 *   npx tsx prisma/seed.ts
 *
 * Reads from backend/.env:
 *   SEED_ADMIN_EMAIL   (default: admin@cfs.local)
 *   SEED_ADMIN_PASSWORD (required)
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@cfs.local';
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    console.error('❌ SEED_ADMIN_PASSWORD is not set in backend/.env');
    process.exit(1);
  }

  const existing = await prisma.admin.findUnique({ where: { email } });

  if (existing) {
    console.log(`⚠️  Admin "${email}" already exists — skipping.`);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.create({
    data: {
      email,
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin created: ${admin.email} (id: ${admin.id})`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
