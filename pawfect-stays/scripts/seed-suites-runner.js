const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

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
    // strip surrounding quotes
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

  const suites = [
    { id: 'suite-standard-1', name: 'Standard Suite 1', tier: 'standard', size: 'medium', pricePerNight: 65, amenities: ['raised_bed'], isActive: true },
    { id: 'suite-standard-2', name: 'Standard Suite 2', tier: 'standard', size: 'medium', pricePerNight: 65, amenities: ['raised_bed'], isActive: true },
    { id: 'suite-deluxe-1', name: 'Deluxe Suite 1', tier: 'deluxe', size: 'large', pricePerNight: 85, amenities: ['webcam','raised_bed'], isActive: true },
    { id: 'suite-luxury-1', name: 'Luxury Suite 1', tier: 'luxury', size: 'large', pricePerNight: 120, amenities: ['webcam','tv','raised_bed'], isActive: true },
  ];

  for (const s of suites) {
    await prisma.suite.upsert({ where: { id: s.id }, update: s, create: s });
  }

  console.log('Seeded suites');
  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
