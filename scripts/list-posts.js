#!/usr/bin/env node

/**
 * List all markdown files that will be uploaded
 * Useful for checking before actual upload
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../packages/content/posts');

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

  return { category, path: postPath, relativePath };
}

function main() {
  console.log('\n📋 Markdown Files List\n');

  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`❌ Posts directory not found: ${POSTS_DIR}`);
    process.exit(1);
  }

  const files = findMarkdownFiles(POSTS_DIR);

  if (files.length === 0) {
    console.log('⚠️  No markdown files found');
    return;
  }

  console.log(`Found ${files.length} files:\n`);

  // Group by category
  const byCategory = {};

  files.forEach(file => {
    const { category, path: postPath, relativePath } = extractPathInfo(file);

    if (!byCategory[category]) {
      byCategory[category] = [];
    }

    byCategory[category].push({ path: postPath, file: relativePath });
  });

  // Print grouped by category
  Object.entries(byCategory)
    .sort()
    .forEach(([category, posts]) => {
      console.log(`\n📁 ${category} (${posts.length} files)`);
      posts.forEach(({ path, file }) => {
        console.log(`  → ${path}`);
        console.log(`    ${file}`);
      });
    });

  console.log(`\n✅ Total: ${files.length} files\n`);
}

main();
