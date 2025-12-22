import { prisma } from '../src/shared/lib/db';

async function checkDuplicates() {
  try {
    // Get all blob files
    const files = await prisma.blobFile.findMany({
      where: { isDeleted: false },
      orderBy: { uploadedAt: 'desc' },
    });

    console.log('Total files in DB:', files.length);
    console.log('\n=== Files ===');

    // Group by pathname to find duplicates
    const pathnameMap = new Map<string, any[]>();

    files.forEach(file => {
      if (!pathnameMap.has(file.pathname)) {
        pathnameMap.set(file.pathname, []);
      }
      pathnameMap.get(file.pathname)!.push(file);
    });

    // Find duplicates
    console.log('\n=== Checking for duplicates ===');
    let hasDuplicates = false;

    for (const [pathname, fileList] of pathnameMap.entries()) {
      if (fileList.length > 1) {
        hasDuplicates = true;
        console.log('\n🔴 DUPLICATE:', pathname);
        console.log('Count:', fileList.length);
        fileList.forEach((f, i) => {
          console.log(`  [${i + 1}] url: ${f.url.substring(0, 60)}...`);
          console.log(`      uploadedAt: ${f.uploadedAt}`);
          console.log(`      lastChecked: ${f.lastChecked}`);
        });
      }
    }

    if (!hasDuplicates) {
      console.log('✅ No duplicates found');
    }

    // Show markdown files
    const markdownFiles = files.filter(
      f => (f.pathname.endsWith('.md') || f.pathname.endsWith('.mdx')) && !f.pathname.includes('/.')
    );

    console.log('\n=== Markdown files ===');
    console.log('Total markdown files:', markdownFiles.length);
    markdownFiles.slice(0, 10).forEach(f => {
      console.log(`- ${f.pathname}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkDuplicates();
