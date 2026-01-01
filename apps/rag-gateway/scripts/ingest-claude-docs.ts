import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '../../..');

const RAG_GATEWAY_URL = process.env.RAG_GATEWAY_URL || 'http://localhost:3002';
const GITHUB_REPO_URL = process.env.GITHUB_REPO_URL || 'https://github.com/BBAK-jun/bbakjun-blog/blob/main';

interface DocFile {
  path: string;
  title: string;
  category: string;
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
      // Extract category from path (e.g., facts/apps/blog-admin/apis)
      const relativePath = fullPath.replace(baseDir + '/', '');
      const pathParts = relativePath.split('/');
      const category = pathParts.slice(0, 3).join('/'); // e.g., facts/apps/blog-admin

      files.push({
        path: fullPath,
        title: item.replace('.md', ''),
        category,
      });
    }
  }

  return files;
}

// Upload document to RAG Gateway
async function uploadDocument(
  file: DocFile
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const content = readFileSync(file.path, 'utf-8');
    const { data: frontMatter, content: markdownContent } = matter(content);

    // Generate GitHub blob URL and slug
    const relativePath = file.path.replace(ROOT_DIR + '/', '');
    const githubUrl = `${GITHUB_REPO_URL}/${relativePath}`;
    const slug = file.path.replace('.claude/docs/', '').replace('.md', '');

    const response = await fetch(`${RAG_GATEWAY_URL}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: frontMatter.title || file.title,
        content: markdownContent,
        metadata: {
          slug,
          githubUrl,
          category: file.category,
          tags: frontMatter.tags || [],
          author: frontMatter.author || 'claude-code',
          description: frontMatter.description || '',
          source: 'upload' as const,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || response.statusText };
    }

    const result = await response.json();
    return { success: true, id: result.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Main function
async function main() {
  const docsPath = join(ROOT_DIR, '.claude/docs');
  console.log('🔍 Scanning .claude/docs for markdown files...');
  const files = getMarkdownFiles(docsPath);
  console.log(`📁 Found ${files.length} markdown files`);

  let successCount = 0;
  let failCount = 0;
  const errors: Array<{ file: string; error: string }> = [];

  console.log('\n📤 Starting upload...\n');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = `[${i + 1}/${files.length}]`;
    process.stdout.write(`\r${progress} Uploading: ${file.path.substring(0, 60)}...`);

    const result = await uploadDocument(file);

    if (result.success) {
      successCount++;
      process.stdout.write(`\r${progress} ✅ ${file.path.substring(0, 60)}\n`);
    } else {
      failCount++;
      errors.push({ file: file.path, error: result.error || 'Unknown error' });
      process.stdout.write(`\r${progress} ❌ ${file.path.substring(0, 60)}\n`);
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n\n=== Summary ===');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${files.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }
}

main().catch(console.error);
