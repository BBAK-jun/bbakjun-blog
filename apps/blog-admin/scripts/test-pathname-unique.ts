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
  console.error('❌ Could not load .env.local');
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function testPathnameUnique() {
  try {
    console.log('🧪 Testing pathname unique constraint...\n');

    const testPathname = 'test/duplicate-prevention.mdx';

    // First upload
    console.log('1️⃣ First upload...');
    await prisma.blobFile.upsert({
      where: { pathname: testPathname },
      create: {
        url: 'https://example.com/test1.mdx',
        pathname: testPathname,
        size: BigInt(1000),
        uploadedAt: new Date(),
        contentType: 'text/markdown',
      },
      update: {
        url: 'https://example.com/test1.mdx',
        size: BigInt(1000),
        uploadedAt: new Date(),
        contentType: 'text/markdown',
        lastChecked: new Date(),
        isDeleted: false,
      },
    });

    const firstCount = await prisma.blobFile.count({
      where: { pathname: testPathname },
    });
    console.log(`   ✅ Record created. Count: ${firstCount}`);

    // Second upload (same pathname, different URL)
    console.log('\n2️⃣ Second upload (same pathname, new URL)...');
    await prisma.blobFile.upsert({
      where: { pathname: testPathname },
      create: {
        url: 'https://example.com/test2.mdx',
        pathname: testPathname,
        size: BigInt(2000),
        uploadedAt: new Date(),
        contentType: 'text/markdown',
      },
      update: {
        url: 'https://example.com/test2.mdx', // Different URL
        size: BigInt(2000),
        uploadedAt: new Date(),
        contentType: 'text/markdown',
        lastChecked: new Date(),
        isDeleted: false,
      },
    });

    const secondCount = await prisma.blobFile.count({
      where: { pathname: testPathname },
    });
    console.log(`   ✅ Record updated. Count: ${secondCount}`);

    // Verify only one record exists
    if (secondCount === 1) {
      console.log('\n✅ SUCCESS: Only one record exists (upsert worked correctly)');

      // Show the record details
      const record = await prisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      console.log('\n📝 Record details:');
      console.log(`   pathname: ${record?.pathname}`);
      console.log(`   url: ${record?.url}`);
      console.log(`   size: ${record?.size}`);
      console.log(`   uploadedAt: ${record?.uploadedAt}`);

      if (record?.url === 'https://example.com/test2.mdx' && record?.size === BigInt(2000)) {
        console.log('\n✅ URL and size were updated correctly!');
      }
    } else {
      console.log(`\n❌ FAILED: Found ${secondCount} records instead of 1`);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.blobFile.delete({
      where: { pathname: testPathname },
    });
    console.log('   ✅ Test data removed');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testPathnameUnique();
