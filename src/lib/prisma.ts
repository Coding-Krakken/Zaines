// Some Prisma client versions expose different runtime entrypoints.
// Resolve the client dynamically so local runtime can still boot when
// Prisma artifacts are unavailable.
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
  pool: Pool | undefined;
};

function loadPrismaClientCtor(): null | (new (args: Record<string, unknown>) => unknown) {
  try {
    const loaded = require("@prisma/client") as { PrismaClient?: new (args: Record<string, unknown>) => unknown };
    return loaded.PrismaClient ?? null;
  } catch {
    return null;
  }
}

// Check if DATABASE_URL is configured
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0;
}

// Create a connection pool with fallback for missing DATABASE_URL
function createPool(): Pool {
  if (!isDatabaseConfigured()) {
    // In development without DATABASE_URL, create a dummy pool that won't connect
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "⚠️  DATABASE_URL is not set. Database operations will fail.\n" +
        "   To fix: Create a .env file with DATABASE_URL=postgresql://user:password@localhost:5432/dbname"
      );
    }
    // Create a pool with max: 0 so it initializes but never connects
    return new Pool({ 
      connectionString: "postgresql://localhost:5432/notconfigured",
      max: 0
    });
  }
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

// Create a connection pool
const pool = globalForPrisma.pool ?? createPool();
const adapter = new PrismaPg(pool);
const PrismaClientCtor = loadPrismaClientCtor();

export const prisma: any =
  globalForPrisma.prisma ??
  (PrismaClientCtor
    ? new PrismaClientCtor({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      })
    : {
        suite: {
          count: async () => {
            throw new Error("PRISMA_CLIENT_UNAVAILABLE");
          },
        },
        booking: {
          count: async () => {
            throw new Error("PRISMA_CLIENT_UNAVAILABLE");
          },
        },
        settings: {
          findUnique: async () => {
            throw new Error("PRISMA_CLIENT_UNAVAILABLE");
          },
          create: async () => {
            throw new Error("PRISMA_CLIENT_UNAVAILABLE");
          },
          upsert: async () => {
            throw new Error("PRISMA_CLIENT_UNAVAILABLE");
          },
          findMany: async () => {
            throw new Error("PRISMA_CLIENT_UNAVAILABLE");
          },
        },
      });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
