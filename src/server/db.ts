import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

/**
 * Prisma over node-postgres, as Neon recommends for Vercel (Fluid compute).
 * DATABASE_URL is Neon's pooled connection string. attachDatabasePool lets
 * Vercel close idle connections before a function instance is suspended;
 * outside Vercel it does nothing.
 */
function createClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool), log: ["warn", "error"] });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
