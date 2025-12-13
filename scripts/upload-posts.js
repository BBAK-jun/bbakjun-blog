#!/usr/bin/env node

/**
 * Bulk Upload Script for Blog Posts to Vercel Blob Storage
 *
 * Usage:
 *   node scripts/upload-posts.js
 *
 * Environment Variables Required:
 *   - BACKOFFICE_API_KEY: API key for authentication
 *   - NEXT_PUBLIC_ADMIN_URL: Blog-admin URL (default: http://localhost:3001)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const POSTS_DIR = path.join(__dirname, '../packages/content/posts');
const API_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
const API_KEY = process.env.BACKOFFICE_API_KEY;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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
 * Recursively find all markdown files
 */
function findMarkdownFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      results = results.concat(findMarkdownFiles(filePath));
    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * Extract category and path from file path
 * Example: packages/content/posts/DEV/my-post/index.mdx -> { category: 'DEV', path: 'DEV/my-post' }
 */
function extractPathInfo(filePath) {
  const relativePath = path.relative(POSTS_DIR, filePath);
  const parts = relativePath.split(path.sep);

  // Remove filename if it's index.mdx
  const filename = parts[parts.length - 1];
  if (filename === 'index.mdx' || filename === 'index.md') {
    parts.pop();
  }

  const category = parts[0]; // First folder is category (DEV, REACT, JS, etc.)
  const postPath = parts.join('/').replace(/\.(mdx|md)$/, '');

  return { category, path: postPath };
}

/**
 * Upload a single file to blog-admin
 */
async function uploadFile(filePath) {
  const { category, path: postPath } = extractPathInfo(filePath);
  const filename = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath);

  // Create FormData with File object (Node.js v18+)
  const formData = new FormData();
  const file = new File([fileContent], filename, { type: 'text/markdown' });
  formData.append('file', file);
  formData.append('path', postPath);
  formData.append('tags', category); // Use category as initial tag
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

/**
 * Main upload function
 */
async function main() {
  log('\n🚀 Blog Posts Bulk Upload Script\n', colors.bright);

  // Validate environment variables
  if (!API_KEY) {
    logError('BACKOFFICE_API_KEY environment variable is not set');
    logInfo('Please set it in your .env.local file or export it:');
    log('  export BACKOFFICE_API_KEY=your-api-key\n');
    process.exit(1);
  }

  // Check if posts directory exists
  if (!fs.existsSync(POSTS_DIR)) {
    logError(`Posts directory not found: ${POSTS_DIR}`);
    process.exit(1);
  }

  logInfo(`Scanning directory: ${POSTS_DIR}`);
  logInfo(`Target API: ${API_URL}\n`);

  // Find all markdown files
  const files = findMarkdownFiles(POSTS_DIR);

  if (files.length === 0) {
    logWarning('No markdown files found');
    process.exit(0);
  }

  log(`Found ${files.length} markdown files\n`, colors.bright);

  // Upload files
  const results = {
    total: files.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = path.relative(POSTS_DIR, file);

    log(`[${i + 1}/${files.length}] Uploading: ${relativePath}`, colors.blue);

    const result = await uploadFile(file);

    if (result.success) {
      logSuccess(`  ✓ Uploaded to: ${result.path}`);
      results.success++;
    } else {
      logError(`  ✗ Failed: ${result.error}`);
      results.failed++;
      results.errors.push({ file: relativePath, error: result.error });
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  log('\n' + '='.repeat(50), colors.cyan);
  log('📊 Upload Summary', colors.bright);
  log('='.repeat(50), colors.cyan);
  log(`Total files:     ${results.total}`);
  logSuccess(`Successful:      ${results.success}`);
  if (results.failed > 0) {
    logError(`Failed:          ${results.failed}`);
  }
  log('='.repeat(50) + '\n', colors.cyan);

  // Print errors if any
  if (results.errors.length > 0) {
    logWarning('Failed uploads:');
    results.errors.forEach(({ file, error }) => {
      log(`  • ${file}: ${error}`, colors.red);
    });
    log('');
  }

  // Exit with error code if any uploads failed
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
