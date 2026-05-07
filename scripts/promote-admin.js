#!/usr/bin/env node
/**
 * Script to promote a user to admin role
 * Usage: node scripts/promote-admin.js <email>
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/promote-admin.js <email>");
  console.error("Example: node scripts/promote-admin.js davidtraversmailbox@gmail.com");
  process.exit(1);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`✓ User ${email} is already an admin`);
      process.exit(0);
    }

    const updated = await prisma.user.update({
      where: { email },
      data: { role: "admin" },
      select: { id: true, email: true, name: true, role: true },
    });

    console.log(`✓ Successfully promoted ${email} to admin`);
    console.log(`  ID: ${updated.id}`);
    console.log(`  Name: ${updated.name || "—"}`);
    console.log(`  Role: ${updated.role}`);
  } catch (error) {
    console.error("❌ Error promoting user:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
