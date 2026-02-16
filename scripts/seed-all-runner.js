import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

async function main() {
  const env = loadEnv();
  const connectionString = env.DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found in .env or process.env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Service types
  const serviceTypes = [
    { id: 'svc-boarding', name: 'Boarding', description: 'Overnight stays' },
    { id: 'svc-daycare', name: 'Daycare', description: 'Daycare services' },
    { id: 'svc-grooming', name: 'Grooming', description: 'Grooming services' },
    { id: 'svc-training', name: 'Training', description: 'Training classes' },
  ];

  for (const s of serviceTypes) {
    await prisma.serviceType.upsert({ where: { id: s.id }, update: s, create: s });
  }

  // Add-ons
  const addOns = [
    { id: 'addon-walk', name: 'Extra Walk', description: '30 minute extra walk', price: 15.0, isActive: true },
    { id: 'addon-groom', name: 'Grooming Add-on', description: 'Quick brush & trim', price: 25.0, isActive: true },
  ];

  for (const a of addOns) {
    await prisma.addOn.upsert({ where: { id: a.id }, update: a, create: a });
  }

  // Settings
  const settings = [
    { key: 'site_name', value: 'Pawfect Stays' },
    { key: 'email_from', value: 'noreply@pawfectstays.com' },
  ];

  for (const s of settings) {
    await prisma.settings.upsert({ where: { key: s.key }, update: s, create: s });
  }

  // Sample user (optional for testing)
  const user = {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test-user@example.com',
    phone: '5550000000',
  };

  await prisma.user.upsert({ where: { id: user.id }, update: user, create: user });

  console.log('Seeded serviceTypes, addOns, settings, and test user');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
