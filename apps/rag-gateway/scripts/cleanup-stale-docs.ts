import { readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '../../..');

const RAG_GATEWAY_URL = process.env.RAG_GATEWAY_URL || 'http://localhost:3002';

interface DocFile {
  path: string;
  slug: string;
}

interface QdrantDocument {
  id: string;
  slug: string;
  title: string;
}

// Get all markdown files recursively
function getMarkdownFiles(
  dir: string,
  baseDir: string = join(ROOT_DIR, '.claude/docs')
): DocFile[] {
  const files: DocFile[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath, baseDir));
    } else if (item.endsWith('.md')) {
      // Generate slug from file path (matches ingest-claude-docs.ts)
      const slug = fullPath.replace(baseDir + '/', '').replace('.md', '');
      files.push({
        path: fullPath,
        slug,
      });
    }
  }

  return files;
}

// Get all documents from Qdrant
async function getQdrantDocuments(): Promise<QdrantDocument[]> {
  const response = await fetch(`${RAG_GATEWAY_URL}/api/documents?limit=1000`);

  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    documents: Array<{ id: string; slug: string; title: string }>;
  };

  return data.documents.map(doc => ({
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
  }));
}

// Delete document from Qdrant
async function deleteDocument(documentId: string): Promise<boolean> {
  try {
    const response = await fetch(`${RAG_GATEWAY_URL}/api/documents/${documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error(`  ❌ Failed to delete ${documentId}: ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`  ❌ Error deleting ${documentId}:`, error);
    return false;
  }
}

// Main function
async function main() {
  console.log('🔍 Scanning .claude/docs for markdown files...');
  const files = getMarkdownFiles(join(ROOT_DIR, '.claude/docs'));
  console.log(`📁 Found ${files.length} markdown files`);

  // Create a set of existing slugs
  const existingSlugs = new Set(files.map(f => f.slug));
  console.log(`✅ Built index of ${existingSlugs.size} unique documents\n`);

  // Get all documents from Qdrant
  console.log('📥 Fetching documents from Qdrant...');
  const qdrantDocs = await getQdrantDocuments();
  console.log(`📊 Qdrant has ${qdrantDocs.length} documents\n`);

  // Find stale documents (in Qdrant but not in filesystem)
  const staleDocs: QdrantDocument[] = [];

  for (const doc of qdrantDocs) {
    // Skip documents that are not from claude-docs (e.g., blog posts)
    if (
      !doc.slug.startsWith('facts/apps/') &&
      !doc.slug.startsWith('insights/apps/') &&
      !doc.slug.startsWith('specs/apps/')
    ) {
      continue;
    }

    if (!existingSlugs.has(doc.slug)) {
      staleDocs.push(doc);
    }
  }

  console.log(`🗑️  Found ${staleDocs.length} stale documents:\n`);

  if (staleDocs.length === 0) {
    console.log('✨ No stale documents found. Database is clean!\n');
    return;
  }

  // List stale documents
  for (const doc of staleDocs) {
    console.log(`  - ${doc.slug} (${doc.title})`);
  }
  console.log();

  // Ask for confirmation
  const confirm = process.argv.includes('--yes') || process.argv.includes('-y');

  if (!confirm) {
    console.log('⚠️  This will DELETE the above documents from Qdrant.');
    console.log('Run with --yes or -y to confirm.\n');
    return;
  }

  // Delete stale documents
  console.log('🗑️  Deleting stale documents...\n');

  let deletedCount = 0;
  let failedCount = 0;

  for (const doc of staleDocs) {
    const success = await deleteDocument(doc.id);

    if (success) {
      deletedCount++;
      console.log(`  ✅ Deleted: ${doc.slug}`);
    } else {
      failedCount++;
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n=== Summary ===');
  console.log(`✅ Deleted: ${deletedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📊 Total stale: ${staleDocs.length}`);

  // Get updated stats
  console.log('\n📊 Updated Qdrant stats:');
  const healthResponse = await fetch(`${RAG_GATEWAY_URL}/api/admin/health`);
  if (healthResponse.ok) {
    const health = await healthResponse.json();
    console.log(`  Vectors: ${health.components.qdrant.vectorsCount}`);
  }
}

main().catch(console.error);
