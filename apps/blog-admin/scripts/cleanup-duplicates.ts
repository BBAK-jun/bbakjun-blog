import { prisma } from '../src/shared/lib/db';

async function cleanupDuplicates() {
  try {
    console.log('🔍 Finding duplicate pathnames...');

    // Get all files grouped by pathname
    const allFiles = await prisma.blobFile.findMany({
      where: { isDeleted: false },
      orderBy: { uploadedAt: 'desc' },
    });

    // Group by pathname
    const pathnameMap = new Map<string, any[]>();
    allFiles.forEach(file => {
      if (!pathnameMap.has(file.pathname)) {
        pathnameMap.set(file.pathname, []);
      }
      pathnameMap.get(file.pathname)!.push(file);
    });

    // Find duplicates
    const duplicates = Array.from(pathnameMap.entries())
      .filter(([_, files]) => files.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      await prisma.$disconnect();
      return;
    }

    console.log(`\n🔴 Found ${duplicates.length} duplicate pathnames\n`);

    // For each duplicate, keep the most recent and delete others
    for (const [pathname, files] of duplicates) {
      console.log(`\nProcessing: ${pathname}`);
      console.log(`  Total records: ${files.length}`);

      // Sort by uploadedAt descending (most recent first)
      files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

      const [keep, ...toDelete] = files;

      console.log(`  ✅ Keeping: ${keep.url.substring(0, 60)}... (${keep.uploadedAt})`);

      // Delete older duplicates
      for (const file of toDelete) {
        console.log(`  ❌ Deleting: ${file.url.substring(0, 60)}... (${file.uploadedAt})`);
        await prisma.blobFile.delete({
          where: { id: file.id },
        });
      }
    }

    console.log('\n✅ Cleanup complete!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

cleanupDuplicates();
