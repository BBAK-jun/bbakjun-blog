# Vercel Blob CDC (Change Data Capture) Documentation

## Problem Statement

Vercel Blob free tier limits to **2,000 operations per month**. The `list()` API call used to fetch file listings counts as an operation. With frequent file management UI interactions, this limit can be exceeded quickly:

- Image picker UI: 1 `list()` call per page load
- Admin dashboard refreshes: Multiple calls per session
- Multiple users: Exponential growth

**Real Issue**: Not uploads (which are infrequent), but **list API calls** (which are very frequent).

## Solution: CDC Pipeline

Implement a Change Data Capture (CDC) pattern that:
1. Caches Vercel Blob file listings in PostgreSQL
2. Syncs periodically (every 5 minutes) instead of on-demand
3. Serves file lists from DB cache instead of Blob API
4. Reduces API calls by ~99% (from 2000+ to ~288 per month)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Vercel Blob Storage (Source of Truth)                      │
│ - Actual file storage                                       │
│ - put(), del() operations                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ list() every 5 minutes (288 calls/month)
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL BlobFile Table (Cache Layer)                    │
│ - Mirrors Blob file metadata                                │
│ - Soft delete pattern (isDeleted flag)                     │
│ - Supports pagination, search, filtering                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ SELECT queries (unlimited, fast)
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Admin UI & Blog App                                         │
│ - Image picker                                              │
│ - File manager                                              │
│ - Dashboard                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### BlobFile Model

**Location**: `apps/blog-admin/prisma/schema.prisma`

```prisma
model BlobFile {
  id          String   @id @default(cuid())
  url         String   @unique           // Blob URL (unique identifier)
  pathname    String                     // File path in Blob storage
  size        BigInt                     // File size in bytes
  uploadedAt  DateTime                   // Upload timestamp from Blob
  contentType String?                    // MIME type (e.g., image/jpeg)

  // CDC metadata
  syncedAt    DateTime @default(now())   // First sync timestamp
  lastChecked DateTime @default(now())   // Last verification timestamp
  isDeleted   Boolean  @default(false)   // Soft delete flag

  // Optional tracking
  uploadedBy  String?                    // User who uploaded (if tracked)

  @@index([pathname])
  @@index([uploadedAt])
  @@index([isDeleted])
  @@map("blob_files")
}
```

### Why BigInt for Size?

PostgreSQL `BIGINT` supports file sizes up to 9,223,372,036,854,775,807 bytes (~9 exabytes), ensuring no overflow for large files.

### Soft Delete Pattern

Instead of deleting records when files are removed from Blob:
- Set `isDeleted: true`
- Set `lastChecked: new Date()`
- Keep record for audit trail

**Benefits**:
- Historical data preserved
- Can detect "resurrection" (re-uploaded files)
- Simplifies sync logic (no cascade deletes)

## Core Functions

### 1. syncBlobToDatabase()

**Location**: `apps/blog-admin/src/lib/blob-cdc.ts`

**Purpose**: Synchronize Blob storage state with PostgreSQL cache

**Algorithm**:
```typescript
1. Fetch all files from Vercel Blob (1 API call)
2. Fetch all non-deleted files from DB
3. Compare URL sets:
   a. New files (in Blob, not in DB) → INSERT
   b. Deleted files (in DB, not in Blob) → UPDATE isDeleted=true
   c. Existing files (in both) → UPDATE lastChecked
4. Return sync statistics
```

**Code**:
```typescript
export async function syncBlobToDatabase() {
  const { blobs } = await list(); // Only API call
  const dbFiles = await prisma.blobFile.findMany({
    where: { isDeleted: false }
  });

  const dbFileUrlsSet = new Set(dbFiles.map(f => f.url));
  const blobUrlsSet = new Set(blobs.map(b => b.url));

  // Add new files
  const newBlobs = blobs.filter(b => !dbFileUrlsSet.has(b.url));
  if (newBlobs.length > 0) {
    await prisma.blobFile.createMany({
      data: newBlobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: BigInt(blob.size),
        uploadedAt: blob.uploadedAt,
        contentType: (blob as any).contentType || null,
      })),
      skipDuplicates: true,
    });
  }

  // Mark deleted files
  const deletedUrls = dbFiles
    .filter(f => !blobUrlsSet.has(f.url))
    .map(f => f.url);
  if (deletedUrls.length > 0) {
    await prisma.blobFile.updateMany({
      where: { url: { in: deletedUrls } },
      data: { isDeleted: true, lastChecked: new Date() },
    });
  }

  // Update existing files
  const existingUrls = blobs
    .filter(b => dbFileUrlsSet.has(b.url))
    .map(b => b.url);
  if (existingUrls.length > 0) {
    await prisma.blobFile.updateMany({
      where: { url: { in: existingUrls } },
      data: { lastChecked: new Date() },
    });
  }

  return {
    total: blobs.length,
    added: newBlobs.length,
    deleted: deletedUrls.length,
    existing: existingUrls.length,
  };
}
```

**Returns**:
```typescript
{
  total: 150,      // Total files in Blob
  added: 5,        // New files added to DB
  deleted: 2,      // Files marked as deleted
  existing: 143    // Files already in DB (updated lastChecked)
}
```

### 2. getCachedBlobFiles()

**Purpose**: Query cached file list from PostgreSQL

**Code**:
```typescript
export async function getCachedBlobFiles(options?: {
  limit?: number;
  offset?: number;
  searchTerm?: string;
}) {
  const { limit = 100, offset = 0, searchTerm } = options || {};

  const where = {
    isDeleted: false,
    ...(searchTerm && {
      pathname: { contains: searchTerm, mode: 'insensitive' as const },
    }),
  };

  const [files, total] = await Promise.all([
    prisma.blobFile.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.blobFile.count({ where }),
  ]);

  return {
    files: files.map(f => ({
      ...f,
      size: Number(f.size), // BigInt to Number for JSON
    })),
    total,
    hasMore: offset + files.length < total,
  };
}
```

**Benefits**:
- Pagination support (infinite scroll)
- Search by pathname
- Fast DB queries (indexed)
- No Blob API calls

### 3. needsSync()

**Purpose**: Check if sync is needed (5-minute threshold)

**Code**:
```typescript
export async function needsSync() {
  const lastSync = await getLastSyncTime();
  if (!lastSync) return true;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return lastSync < fiveMinutesAgo;
}

async function getLastSyncTime() {
  const lastFile = await prisma.blobFile.findFirst({
    orderBy: { lastChecked: 'desc' },
    select: { lastChecked: true },
  });
  return lastFile?.lastChecked || null;
}
```

### 4. Upload Hooks

**Purpose**: Real-time tracking of uploads/deletes

**onBlobUpload()**:
```typescript
export async function onBlobUpload(blob: {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  contentType?: string;
  uploadedBy?: string;
}) {
  return await prisma.blobFile.upsert({
    where: { url: blob.url },
    create: {
      url: blob.url,
      pathname: blob.pathname,
      size: BigInt(blob.size),
      uploadedAt: blob.uploadedAt,
      contentType: blob.contentType,
      uploadedBy: blob.uploadedBy,
    },
    update: {
      lastChecked: new Date(),
      isDeleted: false, // Resurrect if re-uploaded
    },
  });
}
```

**onBlobDelete()**:
```typescript
export async function onBlobDelete(url: string) {
  return await prisma.blobFile.update({
    where: { url },
    data: {
      isDeleted: true,
      lastChecked: new Date(),
    },
  });
}
```

**Usage in API routes**:
```typescript
// In upload-image route
const blob = await put(pathname, file, {...});

try {
  await onBlobUpload({
    url: blob.url,
    pathname: blob.pathname,
    size: file.size,
    uploadedAt: new Date(),
    contentType: file.type,
  });
} catch (cdcError) {
  console.error('CDC sync failed (non-critical):', cdcError);
  // Continue even if CDC fails
}
```

## API Endpoints

### GET /api/admin/blob-files

**Purpose**: Fetch cached file list with auto-sync

**Query Parameters**:
- `limit` (number, default: 100): Max files to return
- `offset` (number, default: 0): Pagination offset
- `search` (string, optional): Search pathname
- `autoSync` (boolean, default: true): Enable auto-sync

**Auto-sync Logic**:
```typescript
const autoSync = searchParams.get('autoSync') !== 'false';

if (autoSync && (await needsSync())) {
  console.log('🔄 Auto-syncing Blob files...');
  await syncBlobToDatabase();
}

const result = await getCachedBlobFiles({
  limit,
  offset,
  searchTerm,
});

return NextResponse.json(result);
```

**Response**:
```json
{
  "files": [
    {
      "id": "clxxxxx",
      "url": "https://xxxxx.public.blob.vercel-storage.com/image.jpg",
      "pathname": "images/2024/image.jpg",
      "size": 1024000,
      "uploadedAt": "2024-12-17T12:00:00Z",
      "contentType": "image/jpeg",
      "syncedAt": "2024-12-17T12:00:00Z",
      "lastChecked": "2024-12-17T12:05:00Z",
      "isDeleted": false,
      "uploadedBy": null
    }
  ],
  "total": 150,
  "hasMore": true
}
```

### POST /api/admin/blob-files/sync

**Purpose**: Manual sync trigger (admin only)

**Authentication**: ADMIN or SUPER_ADMIN role required

**Response**:
```json
{
  "message": "Sync completed",
  "stats": {
    "total": 150,
    "added": 5,
    "deleted": 2,
    "existing": 143
  }
}
```

## Cost Analysis

### Before CDC (Direct Blob API)

Assumptions:
- 10 admin users
- Each user opens image picker 5 times/day
- Each picker call = 1 `list()` operation

**Daily**: 10 users × 5 calls = **50 calls/day**
**Monthly**: 50 × 30 = **1,500 calls/month**

Add automated checks, dashboard refreshes, etc.:
**~2,000+ calls/month** → **Limit exceeded**

### After CDC (Cached)

Sync interval: 5 minutes
**Daily**: (60 min / 5 min) × 24 hours = **288 calls/day**
**Monthly**: 288 / 30 = **~10 calls/day** → **~288 calls/month**

**Savings**: (2000 - 288) / 2000 = **85.6% reduction** (conservative estimate)

With less aggressive usage:
- Old: 500 calls/month
- New: 288 calls/month
- **Savings**: 42.4% reduction

## Migration Guide

### Step 1: Add BlobFile Model

Add to `apps/blog-admin/prisma/schema.prisma`:
```prisma
model BlobFile {
  // ... (see schema above)
}
```

### Step 2: Run Migration

```bash
cd apps/blog-admin
npx prisma migrate dev --name add_blob_cdc
npx prisma generate
```

### Step 3: Initial Sync

Run initial sync to populate DB with existing files:

```bash
# Option A: Via API (requires running server)
curl -X POST http://localhost:3001/api/admin/blob-files/sync \
  -H "Cookie: your-admin-session-cookie"

# Option B: Via script (create if needed)
node scripts/initial-blob-sync.js
```

Or create `scripts/initial-blob-sync.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const { list } = require('@vercel/blob');

const prisma = new PrismaClient();

async function initialSync() {
  const { blobs } = await list();
  console.log(`Found ${blobs.length} files in Blob storage`);

  await prisma.blobFile.createMany({
    data: blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: BigInt(blob.size),
      uploadedAt: blob.uploadedAt,
      contentType: blob.contentType || null,
    })),
    skipDuplicates: true,
  });

  console.log('Initial sync completed');
}

initialSync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Step 4: Update Upload Routes

Add CDC hooks to upload endpoints:

```typescript
import { onBlobUpload } from '@/lib/blob-cdc';

// After successful upload
const blob = await put(pathname, file, {...});

try {
  await onBlobUpload({
    url: blob.url,
    pathname: blob.pathname,
    size: file.size,
    uploadedAt: new Date(),
    contentType: file.type,
  });
} catch (error) {
  console.error('CDC hook failed:', error);
  // Don't fail the upload
}
```

### Step 5: Update Frontend

Replace direct Blob API calls with cached API:

**Before**:
```typescript
import { list } from '@vercel/blob';
const { blobs } = await list();
```

**After**:
```typescript
const response = await fetch('/api/admin/blob-files?limit=100');
const { files } = await response.json();
```

## Monitoring

### Check Sync Status

```sql
-- Last sync time
SELECT MAX("lastChecked") AS last_sync
FROM blob_files;

-- Sync frequency (should be ~5 min intervals)
SELECT
  "lastChecked",
  LAG("lastChecked") OVER (ORDER BY "lastChecked") AS prev_check,
  "lastChecked" - LAG("lastChecked") OVER (ORDER BY "lastChecked") AS interval
FROM (
  SELECT DISTINCT "lastChecked"
  FROM blob_files
  ORDER BY "lastChecked" DESC
  LIMIT 10
) AS recent_checks;
```

### Check File Consistency

```sql
-- Count files
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN "isDeleted" = false THEN 1 ELSE 0 END) AS active,
  SUM(CASE WHEN "isDeleted" = true THEN 1 ELSE 0 END) AS deleted
FROM blob_files;

-- Recently added files
SELECT pathname, "uploadedAt", "syncedAt"
FROM blob_files
WHERE "isDeleted" = false
ORDER BY "syncedAt" DESC
LIMIT 10;

-- Recently deleted files
SELECT pathname, "uploadedAt", "lastChecked"
FROM blob_files
WHERE "isDeleted" = true
ORDER BY "lastChecked" DESC
LIMIT 10;
```

### Vercel Blob Usage

Check Blob dashboard for actual API call counts:
- Expected: ~10 calls/day (~288/month)
- Alert if: >50 calls/day (indicates CDC not working)

## Troubleshooting

### Sync Not Running

**Symptom**: New uploads not appearing in cached list

**Checks**:
1. Check last sync time:
   ```sql
   SELECT MAX("lastChecked") FROM blob_files;
   ```
2. Verify auto-sync is enabled:
   ```typescript
   // In API call
   fetch('/api/admin/blob-files?autoSync=true')
   ```
3. Trigger manual sync:
   ```bash
   curl -X POST http://localhost:3001/api/admin/blob-files/sync
   ```

**Common Causes**:
- Database connection issues
- Blob API credentials invalid
- No requests to API endpoint (sync only runs on GET)

### Missing Files

**Symptom**: File exists in Blob but not in DB cache

**Solution**: Trigger manual sync to reconcile:
```bash
curl -X POST http://localhost:3001/api/admin/blob-files/sync
```

### Deleted Files Still Showing

**Symptom**: File deleted from Blob but still shows in cache

**Expected Behavior**: Files show until next sync (max 5 min delay)

**Force Sync**:
```bash
curl -X POST http://localhost:3001/api/admin/blob-files/sync
```

### BigInt JSON Serialization Error

**Error**: `TypeError: Do not know how to serialize a BigInt`

**Cause**: BigInt fields can't be JSON-serialized directly

**Fix**: Convert to Number before returning:
```typescript
files.map(f => ({
  ...f,
  size: Number(f.size), // BigInt → Number
}))
```

## Performance Optimization

### Indexing

Ensure these indexes exist (defined in schema):
```sql
CREATE INDEX "blob_files_pathname_idx" ON "blob_files"("pathname");
CREATE INDEX "blob_files_uploadedAt_idx" ON "blob_files"("uploadedAt");
CREATE INDEX "blob_files_isDeleted_idx" ON "blob_files"("isDeleted");
```

### Pagination

Always use pagination for large file lists:
```typescript
// Good
fetch('/api/admin/blob-files?limit=100&offset=0')

// Bad (loads all files)
fetch('/api/admin/blob-files?limit=10000')
```

### Search Optimization

For large datasets, consider full-text search:
```prisma
// Add to schema.prisma
@@index([pathname(ops: TextSearchParser)])
```

## Future Enhancements

1. **Webhook-based Sync**:
   - Vercel Blob webhooks for real-time updates
   - Eliminate 5-minute delay

2. **CDN Integration**:
   - Cache file URLs in CDN
   - Serve images directly from CDN

3. **File Analytics**:
   - Track usage (downloads, views)
   - Identify unused files for cleanup

4. **Automated Cleanup**:
   - Delete `isDeleted=true` files after 30 days
   - Archive old files to cheaper storage

5. **Multi-tenant Support**:
   - Separate file listings per user/team
   - Role-based access to files

## References

- [Vercel Blob API Docs](https://vercel.com/docs/storage/vercel-blob)
- [Prisma BigInt](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#bigint)
- [PostgreSQL Indexing](https://www.postgresql.org/docs/current/indexes.html)
