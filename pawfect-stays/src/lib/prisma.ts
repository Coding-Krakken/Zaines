import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Check if DATABASE_URL is configured
export function isDatabaseConfigured(): boolean {
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
      // In production build without DATABASE_URL, create a dummy pool
      // This allows the build to complete; runtime checks will handle actual usage
      console.warn("⚠️  DATABASE_URL not set during build. Creating placeholder client.");
      return new Pool({ connectionString: "postgresql://localhost:5432/notconfigured" });
    }
  }
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

// Lazy initialization - only create client when accessed
let _prisma: PrismaClient | undefined;
let _pool: Pool | undefined;

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (_prisma) {
    return _prisma;
  }

  _pool = createPool();
  const adapter = new PrismaPg(_pool);

  _prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = _prisma;
    globalForPrisma.pool = _pool;
  }

  return _prisma;
}

// Export a proxy that lazily initializes the Prisma client
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
