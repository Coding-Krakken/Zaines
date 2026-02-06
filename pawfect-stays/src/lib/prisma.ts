import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Check if DATABASE_URL is configured
function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0;
}

// Create a connection pool with fallback for missing DATABASE_URL
function createPool(): Pool {
  if (!isDatabaseConfigured()) {
    // In development without DATABASE_URL, log a warning and create a dummy pool
    // This allows the app to start but database operations will fail with clear errors
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "⚠️  DATABASE_URL is not set. Database operations will fail.\n" +
        "   To fix: Create a .env file with DATABASE_URL=postgresql://user:password@localhost:5432/dbname"
      );
      // Create a pool that will fail on first connection attempt
      return new Pool({ connectionString: "postgresql://localhost:5432/notconfigured" });
    } else {
      // In production, fail fast with a clear error
      throw new Error(
        "DATABASE_URL environment variable is required in production. " +
        "Please configure your database connection string."
      );
    }
  }
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

const pool = globalForPrisma.pool ?? createPool();
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Export helper to check database configuration
export { isDatabaseConfigured };

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
