-- Step 1: Cleanup duplicate pathnames (keep most recent)
-- First, mark all duplicates as deleted except the most recent one
WITH duplicates AS (
  SELECT
    pathname,
    id,
    ROW_NUMBER() OVER (PARTITION BY pathname ORDER BY "uploadedAt" DESC, id DESC) as rn
  FROM blob_files
)
DELETE FROM blob_files
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Drop unique constraint from url
DROP INDEX IF EXISTS "blob_files_url_key";

-- Step 3: Add unique constraint to pathname
ALTER TABLE "blob_files" ADD CONSTRAINT "blob_files_pathname_key" UNIQUE ("pathname");

-- Step 4: Drop pathname index (no longer needed since it's unique)
DROP INDEX IF EXISTS "blob_files_pathname_idx";
