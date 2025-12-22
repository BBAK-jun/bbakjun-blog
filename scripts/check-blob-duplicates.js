/**
 * Check for duplicate files in Vercel Blob Storage
 */

const { list } = require('@vercel/blob');

async function checkDuplicates() {
  try {
    console.log('Fetching all files from Blob Storage...\n');

    const { blobs } = await list();

    console.log(`Total files: ${blobs.length}\n`);

    // Group by filename (without path)
    const filesByName = new Map();

    blobs.forEach(blob => {
      const filename = blob.pathname.split('/').pop() || blob.pathname;

      if (!filesByName.has(filename)) {
        filesByName.set(filename, []);
      }

      filesByName.get(filename).push({
        pathname: blob.pathname,
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      });
    });

    // Find duplicates
    const duplicates = [];
    filesByName.forEach((files, filename) => {
      if (files.length > 1) {
        duplicates.push({ filename, files });
      }
    });

    if (duplicates.length === 0) {
      console.log('✅ No duplicate files found!');
      return;
    }

    console.log(`⚠️  Found ${duplicates.length} duplicate filenames:\n`);

    duplicates.forEach(({ filename, files }) => {
      console.log(`📄 ${filename} (${files.length} copies):`);
      files.forEach(file => {
        console.log(`   - ${file.pathname}`);
        console.log(`     Size: ${file.size} bytes`);
        console.log(`     Uploaded: ${file.uploadedAt?.toISOString() || 'Unknown'}`);
        console.log(`     URL: ${file.url}`);
        console.log();
      });
    });

    // Summary
    console.log('\n📊 Summary:');
    console.log(`Total files: ${blobs.length}`);
    console.log(`Unique filenames: ${filesByName.size}`);
    console.log(`Duplicate filenames: ${duplicates.length}`);
    console.log(
      `Total duplicate instances: ${duplicates.reduce((sum, d) => sum + d.files.length, 0)}`
    );
  } catch (error) {
    console.error('Error checking duplicates:', error);
    process.exit(1);
  }
}

checkDuplicates();
