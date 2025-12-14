#!/usr/bin/env node

/**
 * MDX Path Update Script - Replace local image paths with Blob URLs
 *
 * This script:
 * 1. Reads the image URL mapping file created by migrate-images.js
 * 2. Scans all MDX files in packages/content/posts/
 * 3. Replaces /static/images/... paths with Blob URLs
 * 4. Uploads updated MDX files to Vercel Blob Storage
 *
 * Usage:
 *   node scripts/update-mdx-paths.js
 *
 * Environment Variables Required:
 *   - BACKOFFICE_API_KEY: API key for authentication
 *   - NEXT_PUBLIC_ADMIN_URL: Blog-admin URL (default: http://localhost:3001)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const POSTS_DIR = path.join(__dirname, '../packages/content/posts');
const MAPPING_FILE = path.join(__dirname, 'image-url-mapping.json');
const API_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
const API_KEY = process.env.BACKOFFICE_API_KEY;
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set to 'true' to preview changes without uploading

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

/**
 * Load image URL mapping from file
 */
function loadImageMapping() {
  if (!fs.existsSync(MAPPING_FILE)) {
    logError(`Mapping file not found: ${MAPPING_FILE}`);
    logInfo('Please run migrate-images.js first to upload images and generate the mapping file.');
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(MAPPING_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    logError(`Failed to load mapping file: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Recursively find all MDX files
 */
function findMdxFiles(dir) {
  let results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findMdxFiles(filePath));
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * Replace image paths in content with Blob URLs
 */
function replaceImagePaths(content, mapping) {
  let updatedContent = content;
  let replacementCount = 0;
  const replacements = [];

  // Sort keys by length (longest first) to avoid partial replacements
  const sortedPaths = Object.keys(mapping).sort((a, b) => b.length - a.length);

  for (const localPath of sortedPaths) {
    const blobUrl = mapping[localPath];

    // Create regex to match the path in various contexts:
    // - Markdown images: ![alt](/static/images/...)
    // - HTML img tags: <img src="/static/images/..." />
    // - frontmatter images array: images: ['/static/images/...']
    const escapedPath = localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedPath, 'g');

    const matches = updatedContent.match(regex);
    if (matches) {
      updatedContent = updatedContent.replace(regex, blobUrl);
      replacementCount += matches.length;
      replacements.push({
        from: localPath,
        to: blobUrl,
        count: matches.length,
      });
    }
  }

  return {
    content: updatedContent,
    replacementCount,
    replacements,
  };
}

/**
 * Get relative path from posts directory for pathname
 */
function getPostPathname(absolutePath) {
  const relativePath = path.relative(POSTS_DIR, absolutePath);
  const parts = relativePath.split(path.sep);

  // Remove filename if it's index.mdx/index.md
  const filename = parts[parts.length - 1];
  if (filename === 'index.mdx' || filename === 'index.md') {
    parts.pop();
    return parts.join('/') + '/index.mdx';
  }

  return relativePath.replace(/\\/g, '/');
}

/**
 * Upload updated MDX file to Blob Storage
 */
async function uploadUpdatedMdx(pathname, content) {
  const formData = new FormData();
  const file = new File([content], path.basename(pathname), { type: 'text/markdown' });
  formData.append('file', file);
  formData.append('path', pathname.replace(/\.(mdx|md)$/, ''));
  formData.append('tags', pathname.split('/')[0]); // First folder as category
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
      return { success: true, path: pathname };
    } else {
      return {
        success: false,
        path: pathname,
        error: result.error || `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      path: pathname,
      error: error.message,
    };
  }
}

/**
 * Process a single MDX file
 */
async function processMdxFile(filePath, mapping) {
  const relativePath = path.relative(POSTS_DIR, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Replace image paths
  const { content: updatedContent, replacementCount, replacements } = replaceImagePaths(content, mapping);

  // Skip if no changes
  if (replacementCount === 0) {
    return {
      skipped: true,
      file: relativePath,
      reason: 'No image paths found',
    };
  }

  // DRY RUN: Just show what would be replaced
  if (DRY_RUN) {
    return {
      dryRun: true,
      file: relativePath,
      replacementCount,
      replacements,
    };
  }

  // Upload updated content
  const pathname = getPostPathname(filePath);
  const uploadResult = await uploadUpdatedMdx(pathname, updatedContent);

  return {
    ...uploadResult,
    file: relativePath,
    replacementCount,
    replacements,
  };
}

/**
 * Main update function
 */
async function main() {
  log('\n📝 MDX Path Update Script\n', colors.bright);

  if (DRY_RUN) {
    logWarning('DRY RUN MODE: No files will be uploaded (preview only)');
    logInfo('Set DRY_RUN=false to apply changes\n');
  }

  // Validate environment variables
  if (!DRY_RUN && !API_KEY) {
    logError('BACKOFFICE_API_KEY environment variable is not set');
    logInfo('Please set it or use DRY_RUN=true for preview mode');
    process.exit(1);
  }

  // Load image mapping
  logInfo('Loading image URL mapping...');
  const mapping = loadImageMapping();
  logSuccess(`Loaded ${Object.keys(mapping).length} image URL mappings\n`);

  // Check if posts directory exists
  if (!fs.existsSync(POSTS_DIR)) {
    logError(`Posts directory not found: ${POSTS_DIR}`);
    process.exit(1);
  }

  logInfo(`Scanning directory: ${POSTS_DIR}`);
  if (!DRY_RUN) {
    logInfo(`Target API: ${API_URL}\n`);
  }

  // Find all MDX files
  const mdxFiles = findMdxFiles(POSTS_DIR);

  if (mdxFiles.length === 0) {
    logWarning('No MDX files found');
    process.exit(0);
  }

  log(`Found ${mdxFiles.length} MDX files\n`, colors.bright);

  // Process files
  const results = {
    total: mdxFiles.length,
    updated: 0,
    skipped: 0,
    failed: 0,
    totalReplacements: 0,
    errors: [],
  };

  for (let i = 0; i < mdxFiles.length; i++) {
    const file = mdxFiles[i];
    const relativePath = path.relative(POSTS_DIR, file);

    log(`[${i + 1}/${mdxFiles.length}] ${relativePath}`, colors.blue);

    const result = await processMdxFile(file, mapping);

    if (result.skipped) {
      logInfo(`  ⏭  Skipped: ${result.reason}`);
      results.skipped++;
    } else if (result.dryRun) {
      logWarning(`  🔍 Would replace ${result.replacementCount} image path(s):`);
      result.replacements.forEach(({ from, to, count }) => {
        log(`     • ${from} → ${to.substring(0, 60)}... (${count}x)`, colors.yellow);
      });
      results.updated++;
      results.totalReplacements += result.replacementCount;
    } else if (result.success) {
      logSuccess(`  ✓ Updated ${result.replacementCount} image path(s) and uploaded`);
      results.updated++;
      results.totalReplacements += result.replacementCount;
    } else {
      logError(`  ✗ Failed: ${result.error}`);
      results.failed++;
      results.errors.push({ file: relativePath, error: result.error });
    }

    // Small delay to avoid overwhelming the API
    if (!DRY_RUN) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Print summary
  log('\n' + '='.repeat(60), colors.cyan);
  log('📊 Update Summary', colors.bright);
  log('='.repeat(60), colors.cyan);
  log(`Total files:     ${results.total}`);
  logSuccess(`Updated:         ${results.updated}`);
  logInfo(`Skipped:         ${results.skipped}`);
  if (results.failed > 0) {
    logError(`Failed:          ${results.failed}`);
  }
  log(`Total replacements: ${results.totalReplacements}`);
  log('='.repeat(60) + '\n', colors.cyan);

  // Print errors if any
  if (results.errors.length > 0) {
    logWarning('Failed updates:');
    results.errors.forEach(({ file, error }) => {
      log(`  • ${file}: ${error}`, colors.red);
    });
    log('');
  }

  // Next steps
  if (DRY_RUN) {
    log('📝 To apply these changes:', colors.magenta);
    log('  DRY_RUN=false node scripts/update-mdx-paths.js\n');
  } else {
    log('🎉 All MDX files have been updated!', colors.magenta);
    log('📝 Next Steps:', colors.magenta);
    log('  1. Verify images in blog (dev and production)');
    log('  2. Optionally remove apps/blog/public/static/images/');
    log('  3. Update .gitignore if needed\n');
  }

  // Exit with error code if any updates failed
  if (results.failed > 0) {
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
