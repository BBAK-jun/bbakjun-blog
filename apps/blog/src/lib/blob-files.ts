/**
 * Blob Files Helper for Blog App
 * Fetches cached blob file list from blog-admin API
 */

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

export interface BlobFile {
  id: string;
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  contentType: string | null;
  syncedAt: Date;
  lastChecked: Date;
  isDeleted: boolean;
  uploadedBy: string | null;
}

export interface BlobFilesResponse {
  files: BlobFile[];
  total: number;
  hasMore: boolean;
}

/**
 * Get cached blob files from blog-admin API
 * Uses CDC cached data instead of direct Vercel Blob API calls
 */
export async function getCachedBlobFiles(options?: {
  limit?: number;
  offset?: number;
  searchTerm?: string;
}): Promise<BlobFilesResponse> {
  const { limit = 1000, offset = 0, searchTerm } = options || {};

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    ...(searchTerm && { search: searchTerm }),
  });

  const response = await fetch(`${ADMIN_URL}/api/public/blob-files?${params}`, {
    // Cache for 5 minutes (same as CDC auto-sync interval)
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch blob files: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get markdown files only
 */
export async function getMarkdownFiles(limit = 100) {
  const { files } = await getCachedBlobFiles({ limit: 1000 });

  return files
    .filter(
      (file) =>
        (file.pathname.endsWith('.md') || file.pathname.endsWith('.mdx')) &&
        !file.pathname.includes('/.')
    )
    .slice(0, limit);
}

/**
 * Get image files only
 */
export async function getImageFiles(limit = 50) {
  const { files } = await getCachedBlobFiles({
    limit: 1000,
    searchTerm: 'images/',
  });

  return files
    .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.pathname))
    .slice(0, limit);
}

/**
 * Find a specific file by pathname
 */
export async function findFileByPathname(pathname: string) {
  const { files } = await getCachedBlobFiles();
  return files.find((file) => file.pathname === pathname);
}
