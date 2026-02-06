import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Check if DATABASE_URL is configured
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV !== "test") {
  console.warn(
    "⚠️  DATABASE_URL is not configured. Database features will be unavailable.\n" +
    "   Please set DATABASE_URL environment variable to enable database features.\n" +
    "   Example: DATABASE_URL=\"postgresql://user:password@localhost:5432/pawfect_stays\""
  );
}

// Create a connection pool only if DATABASE_URL is available
// Use a dummy URL for the pool if DATABASE_URL is not set to prevent crashes
const poolConnectionString = databaseUrl || "postgresql://localhost:5432/dummy";
const pool = globalForPrisma.pool ?? new Pool({ 
  connectionString: poolConnectionString,
  // Don't connect immediately if using dummy URL
  ...(databaseUrl ? {} : { max: 0, idleTimeoutMillis: 0 })
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

/**
 * Check if database is configured
 */
export function isDatabaseConfigured(): boolean {
  return !!databaseUrl;
}
