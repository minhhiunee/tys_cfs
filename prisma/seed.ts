/**
 * Seed script — creates the initial admin accounts.
 *
 * Usage:
 *   npx tsx prisma/seed.ts
 */
import 'dotenv/config';
import { PrismaClient, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();

  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const passwordHash = await bcrypt.hash(password, 12);

  const accounts = [
    { email: 'superadmin@cfs.local', role: 'SUPER_ADMIN' as AdminRole },
    { email: 'admin1@cfs.local', role: 'ADMIN' as AdminRole },
    { email: 'admin2@cfs.local', role: 'ADMIN' as AdminRole },
    { email: 'admin3@cfs.local', role: 'ADMIN' as AdminRole },
    { email: 'admin4@cfs.local', role: 'ADMIN' as AdminRole },
  ];

  for (const account of accounts) {
    const existing = await prisma.admin.findUnique({ where: { email: account.email } });
    
    if (!existing) {
      const created = await prisma.admin.create({
        data: {
          email: account.email,
          passwordHash,
          role: account.role,
        },
      });
      console.log(`✅ Admin created: ${created.email} (Role: ${created.role})`);
    } else {
      // If it exists but we want to ensure the role is correct (e.g. if we had admin@cfs.local before)
      // we could update it, but for now we just skip.
      console.log(`⚠️  Admin "${account.email}" already exists — skipping.`);
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
