import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as D1PrismaClient } from '../../generated/d1/client';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { env } from '@/env';

type PrismaGlobal = {
  prisma: unknown;
};

const globalForPrisma = globalThis as unknown as PrismaGlobal;

const createNeonClient = () => {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when DB_PROVIDER=neon');
  }

  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
};

const createD1Client = () => {
  const cloudflareEnv = getCloudflareContext().env as typeof getCloudflareContext extends never
    ? never
    : typeof getCloudflareContext extends () => infer Context
      ? Context extends { env: infer Environment }
        ? Environment & { DB: ConstructorParameters<typeof PrismaD1>[0] }
        : never
      : never;
  if (!cloudflareEnv.DB) {
    throw new Error('Cloudflare D1 binding DB is required when DB_PROVIDER=d1');
  }

  const adapter = new PrismaD1(cloudflareEnv.DB);
  return new D1PrismaClient({ adapter });
};

const createPrismaClient = () => (env.DB_PROVIDER === 'd1' ? createD1Client() : createNeonClient());

export const prisma = (globalForPrisma.prisma ?? createPrismaClient()) as PrismaClient;

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
