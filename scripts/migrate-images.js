#!/usr/bin/env node

/**
 * Image Migration Script - Upload local images to Vercel Blob Storage
 *
 * This script:
 * 1. Scans apps/blog/public/static/images/ for all image files
 * 2. Uploads each image to Vercel Blob Storage preserving path structure
 * 3. Creates a mapping file (path -> Blob URL) for later MDX updates
 *
 * Usage:
 *   node scripts/migrate-images.js
 *
 * Environment Variables Required:
 *   - BACKOFFICE_API_KEY: API key for authentication
 *   - NEXT_PUBLIC_ADMIN_URL: Blog-admin URL (default: http://localhost:3001)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const IMAGES_DIR = path.join(__dirname, '../apps/blog/public/static/images');
const API_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
const API_KEY = process.env.BACKOFFICE_API_KEY;
const MAPPING_FILE = path.join(__dirname, 'image-url-mapping.json');

// Supported image extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

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
 * Recursively find all image files
 */
function findImageFiles(dir) {
  let results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      results = results.concat(findImageFiles(filePath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        results.push(filePath);
      }
    }
  }

  return results;
}

/**
 * Get relative path from images directory
 * Example: /absolute/path/to/apps/blog/public/static/images/DEV/mvvm/mvvm.png
 *       -> DEV/mvvm/mvvm.png
 */
function getRelativePath(absolutePath) {
  return path.relative(IMAGES_DIR, absolutePath);
}

/**
 * Convert relative path to Blob pathname
 * Example: DEV/mvvm/mvvm.png -> images/DEV/mvvm/mvvm.png
 */
function toBlobPathname(relativePath) {
  return `images/${relativePath}`;
}

/**
 * Convert relative path to original URL used in MDX
 * Example: DEV/mvvm/mvvm.png -> /static/images/DEV/mvvm/mvvm.png
 */
function toOriginalUrl(relativePath) {
  return `/static/images/${relativePath}`;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Upload a single image to Vercel Blob via blog-admin API
 */
async function uploadImage(filePath) {
  const relativePath = getRelativePath(filePath);
  const blobPathname = toBlobPathname(relativePath);
  const filename = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath);
  const mimeType = getMimeType(filePath);

  // Create FormData with File object
  const formData = new FormData();
  const file = new File([fileContent], filename, { type: mimeType });
  formData.append('file', file);
  formData.append('pathname', blobPathname); // Preserve path structure

  try {
    const response = await fetch(`${API_URL}/api/admin/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        originalPath: toOriginalUrl(relativePath),
        blobUrl: result.url,
        blobPathname: result.pathname,
        size: result.size,
      };
    } else {
      return {
        success: false,
        originalPath: toOriginalUrl(relativePath),
        error: result.error || `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      originalPath: toOriginalUrl(relativePath),
      error: error.message,
    };
  }
}

/**
 * Save URL mapping to file
 */
function saveMappingFile(mapping) {
  fs.writeFileSync(
    MAPPING_FILE,
    JSON.stringify(mapping, null, 2),
    'utf8'
  );
  logSuccess(`Mapping saved to: ${MAPPING_FILE}`);
}

/**
 * Load existing mapping file if exists
 */
function loadExistingMapping() {
  if (fs.existsSync(MAPPING_FILE)) {
    try {
      const content = fs.readFileSync(MAPPING_FILE, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logWarning(`Failed to load existing mapping: ${error.message}`);
      return {};
    }
  }
  return {};
}

/**
 * Main migration function
 */
async function main() {
  log('\n🖼️  Image Migration to Vercel Blob Storage\n', colors.bright);

  // Validate environment variables
  if (!API_KEY) {
    logError('BACKOFFICE_API_KEY environment variable is not set');
    logInfo('Please set it in your .env.local file or export it:');
    log('  export BACKOFFICE_API_KEY=your-api-key\n');
    process.exit(1);
  }

  // Check if images directory exists
  if (!fs.existsSync(IMAGES_DIR)) {
    logError(`Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  logInfo(`Scanning directory: ${IMAGES_DIR}`);
  logInfo(`Target API: ${API_URL}\n`);

  // Find all image files
  const imageFiles = findImageFiles(IMAGES_DIR);

  if (imageFiles.length === 0) {
    logWarning('No image files found');
    process.exit(0);
  }

  log(`Found ${imageFiles.length} image files\n`, colors.bright);

  // Load existing mapping (in case of resume)
  const urlMapping = loadExistingMapping();
  const existingCount = Object.keys(urlMapping).length;

  if (existingCount > 0) {
    logInfo(`Found existing mapping with ${existingCount} entries`);
    logInfo('Will skip already uploaded images\n');
  }

  // Upload images
  const results = {
    total: imageFiles.length,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const relativePath = getRelativePath(file);
    const originalUrl = toOriginalUrl(relativePath);

    log(`[${i + 1}/${imageFiles.length}] ${relativePath}`, colors.blue);

    // Skip if already uploaded
    if (urlMapping[originalUrl]) {
      logInfo(`  ⏭  Already uploaded: ${urlMapping[originalUrl]}`);
      results.skipped++;
      continue;
    }

    const result = await uploadImage(file);

    if (result.success) {
      logSuccess(`  ✓ Uploaded: ${result.blobUrl}`);
      urlMapping[result.originalPath] = result.blobUrl;
      results.success++;

      // Save mapping after each successful upload (in case of crash)
      saveMappingFile(urlMapping);
    } else {
      logError(`  ✗ Failed: ${result.error}`);
      results.failed++;
      results.errors.push({ file: relativePath, error: result.error });
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Print summary
  log('\n' + '='.repeat(60), colors.cyan);
  log('📊 Migration Summary', colors.bright);
  log('='.repeat(60), colors.cyan);
  log(`Total images:    ${results.total}`);
  logSuccess(`Successful:      ${results.success}`);
  if (results.skipped > 0) {
    logInfo(`Skipped:         ${results.skipped}`);
  }
  if (results.failed > 0) {
    logError(`Failed:          ${results.failed}`);
  }
  log('='.repeat(60) + '\n', colors.cyan);

  // Print mapping info
  logInfo(`URL mapping saved with ${Object.keys(urlMapping).length} entries`);
  logInfo(`Mapping file: ${MAPPING_FILE}\n`);

  // Print errors if any
  if (results.errors.length > 0) {
    logWarning('Failed uploads:');
    results.errors.forEach(({ file, error }) => {
      log(`  • ${file}: ${error}`, colors.red);
    });
    log('');
  }

  // Next steps
  log('📝 Next Steps:', colors.magenta);
  log('  1. Review the mapping file to verify all uploads');
  log('  2. Run update-mdx-paths.js to update MDX files with new Blob URLs');
  log('  3. Test images in dev/production environments\n');

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
