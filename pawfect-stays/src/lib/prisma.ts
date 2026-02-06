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
// When DATABASE_URL is missing, we create a dummy pool that won't attempt connections
// This allows Prisma to initialize without crashing, but any actual database operations will fail gracefully
const poolConnectionString = databaseUrl || "postgresql://localhost:5432/dummy";
const pool = globalForPrisma.pool ?? new Pool({ 
  connectionString: poolConnectionString,
  // Prevent connection attempts when using dummy URL by setting max connections to 0
  // This ensures the pool never tries to establish actual connections to the dummy database
  ...(databaseUrl ? {} : { max: 0, idleTimeoutMillis: 0, connectionTimeoutMillis: 0 })
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
 * Check if database is configured.
 * Use this to guard database operations in API routes.
 */
export function isDatabaseConfigured(): boolean {
  return !!databaseUrl;
}
