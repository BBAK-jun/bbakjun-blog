/**
 * Clean up duplicate MDX files in Vercel Blob Storage
 * Keep only the most recently uploaded version of each file
 */

const { list, del } = require('@vercel/blob');

async function cleanupDuplicates() {
  try {
    console.log('Fetching all files from Blob Storage...\n');

    const { blobs } = await list();

    console.log(`Total files: ${blobs.length}\n`);

    // Group MDX files by pathname (excluding .metadata.json files)
    const mdxFilesByPath = new Map();

    blobs.forEach(blob => {
      // Only process .mdx files
      if (!blob.pathname.endsWith('.mdx')) {
        return;
      }

      // Extract the logical path (folder + filename)
      // e.g., "DEV/about_zustand/index.mdx" -> "DEV/about_zustand/index.mdx"
      const pathKey = blob.pathname;

      if (!mdxFilesByPath.has(pathKey)) {
        mdxFilesByPath.set(pathKey, []);
      }

      mdxFilesByPath.get(pathKey).push({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      });
    });

    // Find files with duplicates
    const duplicates = [];
    mdxFilesByPath.forEach((files, path) => {
      if (files.length > 1) {
        // Sort by upload date (newest first)
        files.sort((a, b) => {
          const dateA = a.uploadedAt ? new Date(a.uploadedAt) : new Date(0);
          const dateB = b.uploadedAt ? new Date(b.uploadedAt) : new Date(0);
          return dateB - dateA;
        });

        duplicates.push({ path, files });
      }
    });

    if (duplicates.length === 0) {
      console.log('✅ No duplicate MDX files found!');
      return;
    }

    console.log(`Found ${duplicates.length} MDX files with duplicates\n`);

    // Calculate deletion stats
    let filesToDelete = 0;
    duplicates.forEach(({ files }) => {
      filesToDelete += files.length - 1; // Keep the first one (newest)
    });

    console.log(`📊 Summary:`);
    console.log(`Total MDX files with duplicates: ${duplicates.length}`);
    console.log(`Files to keep (latest versions): ${duplicates.length}`);
    console.log(`Files to delete (older versions): ${filesToDelete}\n`);

    // Delete old versions
    console.log('🗑️  Deleting old versions...\n');

    let deletedCount = 0;
    let errorCount = 0;

    for (const { path, files } of duplicates) {
      // Keep the first file (newest), delete the rest
      const [keep, ...toDelete] = files;

      console.log(`📄 ${path}`);
      console.log(`   ✅ Keeping: ${keep.uploadedAt?.toISOString()} (${keep.size} bytes)`);

      for (const file of toDelete) {
        try {
          await del(file.url);
          console.log(`   ❌ Deleted: ${file.uploadedAt?.toISOString()} (${file.size} bytes)`);
          deletedCount++;
        } catch (error) {
          console.log(
            `   ⚠️  Failed to delete: ${file.uploadedAt?.toISOString()} - ${error.message}`
          );
          errorCount++;
        }
      }
      console.log();
    }

    console.log('\n✨ Cleanup complete!');
    console.log(`Successfully deleted: ${deletedCount} files`);
    if (errorCount > 0) {
      console.log(`Failed to delete: ${errorCount} files`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDuplicates();
