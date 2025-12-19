import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local manually
const envPath = join(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove surrounding quotes (both single and double)
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.error('❌ Could not load .env.local');
}

// Direct database connection without env validation
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function cleanupDuplicates() {
  try {
    console.log('🔍 Finding duplicate pathnames...\n');

    // First, check for duplicates
    const duplicates = await prisma.$queryRaw<Array<{ pathname: string; count: bigint }>>`
      SELECT pathname, COUNT(*) as count
      FROM blob_files
      GROUP BY pathname
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      await prisma.$disconnect();
      return;
    }

    console.log(`🔴 Found ${duplicates.length} duplicate pathnames:\n`);
    duplicates.forEach(d => {
      console.log(`  - ${d.pathname} (${d.count} records)`);
    });

    // Show details for each duplicate
    for (const dup of duplicates) {
      const files = await prisma.blobFile.findMany({
        where: { pathname: dup.pathname },
        orderBy: { uploadedAt: 'desc' },
      });

      console.log(`\n📝 ${dup.pathname}:`);
      files.forEach((f, i) => {
        console.log(`  [${i + 1}] ${i === 0 ? '✅ KEEP' : '❌ DELETE'}`);
        console.log(`      id: ${f.id}`);
        console.log(`      url: ${f.url.substring(0, 60)}...`);
        console.log(`      uploadedAt: ${f.uploadedAt.toISOString()}`);
      });
    }

    console.log('\n⚠️  About to delete duplicate records (keeping most recent for each pathname)...');
    console.log('Press Ctrl+C to cancel, or waiting 3 seconds...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Execute cleanup using raw SQL for better performance
    const result = await prisma.$executeRaw`
      WITH duplicates AS (
        SELECT
          pathname,
          id,
          ROW_NUMBER() OVER (PARTITION BY pathname ORDER BY "uploadedAt" DESC, id DESC) as rn
        FROM blob_files
      )
      DELETE FROM blob_files
      WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
      )
    `;

    console.log(`✅ Cleanup complete! Deleted ${result} duplicate records.`);

    // Verify no duplicates remain
    const remaining = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM blob_files
      GROUP BY pathname
      HAVING COUNT(*) > 1
    `;

    if (remaining.length === 0) {
      console.log('✅ Verified: No duplicates remain!');
    } else {
      console.log(`⚠️  Warning: ${remaining.length} duplicates still exist`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

cleanupDuplicates();
