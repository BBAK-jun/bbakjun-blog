#!/usr/bin/env node

/**
 * Test Upload Script - Uploads only first 3 files for testing
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../packages/content/posts');
const API_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
const API_KEY = process.env.BACKOFFICE_API_KEY;

function findMarkdownFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findMarkdownFiles(filePath));
    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
      results.push(filePath);
    }
  }

  return results;
}

function extractPathInfo(filePath) {
  const relativePath = path.relative(POSTS_DIR, filePath);
  const parts = relativePath.split(path.sep);

  const filename = parts[parts.length - 1];
  if (filename === 'index.mdx' || filename === 'index.md') {
    parts.pop();
  }

  const category = parts[0];
  const postPath = parts.join('/').replace(/\.(mdx|md)$/, '');

  return { category, path: postPath };
}

async function uploadFile(filePath) {
  const { category, path: postPath } = extractPathInfo(filePath);
  const filename = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath);

  const FormData = (await import('formdata-node')).FormData;
  const { File } = await import('formdata-node');

  const formData = new FormData();
  const file = new File([fileContent], filename, { type: 'text/markdown' });
  formData.append('file', file);
  formData.append('path', postPath);
  formData.append('tags', category);
  formData.append('status', 'PUBLISHED');

  try {
    const response = await fetch(`${API_URL}/api/admin/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return { success: true, path: postPath };
    } else {
      return {
        success: false,
        path: postPath,
        error: result.error || `HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      path: postPath,
      error: error.message
    };
  }
}

async function main() {
  console.log('\n🧪 Test Upload Script (First 3 files)\n');

  if (!API_KEY) {
    console.error('❌ BACKOFFICE_API_KEY environment variable is not set');
    process.exit(1);
  }

  console.log(`ℹ️  Target API: ${API_URL}\n`);

  const files = findMarkdownFiles(POSTS_DIR).slice(0, 3);

  console.log(`Found ${files.length} files for testing\n`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = path.relative(POSTS_DIR, file);

    console.log(`[${i + 1}/${files.length}] Uploading: ${relativePath}`);

    const result = await uploadFile(file);

    if (result.success) {
      console.log(`  ✅ Success: ${result.path}`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
  }

  console.log('\n✅ Test complete!\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  console.error(error);
  process.exit(1);
});
