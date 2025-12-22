import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local for tests
const envPath = join(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.warn('Warning: Could not load .env.local');
}

// Global test database client
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required for tests');
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
export const testPrisma = new PrismaClient({ adapter });

// Cleanup test data before and after all tests
beforeAll(async () => {
  // Clean up any test data from previous runs
  await testPrisma.blobFile.deleteMany({
    where: {
      pathname: {
        startsWith: 'test/',
      },
    },
  });
});

afterAll(async () => {
  // Clean up test data
  await testPrisma.blobFile.deleteMany({
    where: {
      pathname: {
        startsWith: 'test/',
      },
    },
  });
  await testPrisma.$disconnect();
});
