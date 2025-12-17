/**
 * Initial Blob CDC Sync Script
 * Populates the BlobFile table with existing files from Vercel Blob Storage
 */

// Load environment variables from .env BEFORE importing Prisma
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { list } = require('@vercel/blob');

// Use shared prisma instance
const { prisma } = require('../src/shared/lib/db');

async function initialSync() {
  console.log('🔄 Starting initial Blob CDC sync...\n');

  try {
    // Fetch all files from Vercel Blob
    console.log('📦 Fetching files from Vercel Blob Storage...');
    const { blobs } = await list();
    console.log(`✅ Found ${blobs.length} files in Blob storage\n`);

    if (blobs.length === 0) {
      console.log('ℹ️  No files to sync');
      return;
    }

    // Insert files into database
    console.log('💾 Inserting files into database...');
    const result = await prisma.blobFile.createMany({
      data: blobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: BigInt(blob.size),
        uploadedAt: blob.uploadedAt,
        contentType: blob.contentType || null,
      })),
      skipDuplicates: true,
    });

    console.log(`✅ Inserted ${result.count} files into database\n`);

    // Show sample of synced files
    console.log('📋 Sample of synced files:');
    const samples = blobs.slice(0, 5);
    samples.forEach((blob, i) => {
      console.log(`  ${i + 1}. ${blob.pathname}`);
      console.log(`     Size: ${(blob.size / 1024).toFixed(2)} KB`);
      console.log(`     URL: ${blob.url.substring(0, 60)}...`);
    });

    if (blobs.length > 5) {
      console.log(`  ... and ${blobs.length - 5} more files`);
    }

    console.log('\n✨ Initial sync completed successfully!');
    console.log(`📊 Total files synced: ${result.count}/${blobs.length}`);

    if (result.count < blobs.length) {
      console.log(`ℹ️  ${blobs.length - result.count} files were already in database (skipped)`);
    }

  } catch (error) {
    console.error('❌ Initial sync failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
initialSync()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  });
