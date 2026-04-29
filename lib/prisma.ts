import { PrismaClient } from '@prisma/client';

import { getEnv } from './config';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
let prismaClient: PrismaClient | undefined;

function buildDatabaseUrl(base: string): string {
  // In serverless environments each Lambda keeps its own connection pool.
  // Cap it at 5 connections per instance to avoid exhausting the DB limit.
  if (process.env.NODE_ENV !== 'production') return base;
  if (base.includes('connection_limit=') || base.includes('pgbouncer=')) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}connection_limit=5&pool_timeout=10`;
}

function createPrismaClient() {
  const rawUrl = getEnv('DATABASE_URL');

  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: { url: buildDatabaseUrl(rawUrl) }
    }
  });
}

function getPrismaClient() {
  if (prismaClient) return prismaClient;

  prismaClient = globalForPrisma.prisma ?? createPrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient;
  }

  return prismaClient;
}

// Delay Prisma initialization until the app actually touches the client.
// This keeps build-time route analysis from crashing when DATABASE_URL is only
// provided in the deployment environment at runtime.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
