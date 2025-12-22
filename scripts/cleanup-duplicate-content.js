/**
 * Clean up duplicate MDX files based on content similarity
 * Keep files in folder structure (e.g., keep "DEV/splash-ux/index.mdx" over "DEV/splash-ux.mdx")
 */

const { list, del } = require('@vercel/blob');

async function cleanupDuplicateContent() {
  try {
    console.log('Fetching all MDX files from Blob Storage...\n');

    const { blobs } = await list();

    // Filter only MDX files
    const mdxFiles = blobs
      .filter(blob => blob.pathname.endsWith('.mdx'))
      .map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      }));

    console.log(`Total MDX files: ${mdxFiles.length}\n`);

    // Group files by their logical post path
    // e.g., "career/2025-handover.mdx" and "career/2025-handover/2025-handover.mdx" should be grouped
    const fileGroups = new Map();

    mdxFiles.forEach(file => {
      const parts = file.pathname.split('/');
      let postKey;

      // Extract the post identifier
      if (parts.length === 2) {
        // e.g., "career/2025-handover.mdx" -> postKey: "career/2025-handover"
        postKey = file.pathname.replace('.mdx', '');
      } else if (parts.length >= 3) {
        // e.g., "career/2025-handover/2025-handover.mdx" -> postKey: "career/2025-handover"
        // or "DEV/splash-ux/index.mdx" -> postKey: "DEV/splash-ux"
        const category = parts[0];
        const folder = parts[1];
        postKey = `${category}/${folder}`;
      }

      if (postKey) {
        if (!fileGroups.has(postKey)) {
          fileGroups.set(postKey, []);
        }
        fileGroups.get(postKey).push(file);
      }
    });

    // Find duplicates and determine which to keep
    const toDelete = [];

    fileGroups.forEach((files, postKey) => {
      if (files.length > 1) {
        // Prefer folder structure (index.mdx) over flat files
        // Sort: index.mdx files first, then by upload date (newest first)
        files.sort((a, b) => {
          const aIsIndex = a.pathname.endsWith('/index.mdx');
          const bIsIndex = b.pathname.endsWith('/index.mdx');

          if (aIsIndex && !bIsIndex) return -1;
          if (!aIsIndex && bIsIndex) return 1;

          // If both are index or both are not, sort by date
          const dateA = a.uploadedAt ? new Date(a.uploadedAt) : new Date(0);
          const dateB = b.uploadedAt ? new Date(b.uploadedAt) : new Date(0);
          return dateB - dateA;
        });

        const [keep, ...deleteFiles] = files;

        console.log(`\n📁 ${postKey} (${files.length} files)`);
        console.log(`   ✅ KEEP: ${keep.pathname} (${keep.uploadedAt?.toISOString()})`);

        deleteFiles.forEach(file => {
          console.log(`   ❌ DELETE: ${file.pathname} (${file.uploadedAt?.toISOString()})`);
          toDelete.push(file);
        });
      }
    });

    if (toDelete.length === 0) {
      console.log('\n✅ No duplicate content files found!');
      return;
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`Total file groups: ${fileGroups.size}`);
    console.log(
      `Duplicate groups found: ${Array.from(fileGroups.values()).filter(f => f.length > 1).length}`
    );
    console.log(`Files to delete: ${toDelete.length}\n`);

    // Ask for confirmation (in production, you might want to add a --dry-run flag)
    console.log('🗑️  Deleting duplicate files...\n');

    let deletedCount = 0;
    let errorCount = 0;

    for (const file of toDelete) {
      try {
        await del(file.url);
        console.log(`✓ Deleted: ${file.pathname}`);
        deletedCount++;
      } catch (error) {
        console.log(`✗ Failed: ${file.pathname} - ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n✨ Cleanup complete!`);
    console.log(`Successfully deleted: ${deletedCount} files`);
    if (errorCount > 0) {
      console.log(`Failed to delete: ${errorCount} files`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDuplicateContent();
