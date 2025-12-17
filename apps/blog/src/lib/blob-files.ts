/**
 * Blob Files Helper for Blog App
 * Fetches cached blob file list from blog-admin API
 */

import type { paths } from '@/generated/blog-admin-openapi';

const BLOG_ADMIN_URL =
  process.env.NEXT_PUBLIC_BLOG_ADMIN_URL || 'http://localhost:3001';

type BlobFilesResponse =
  paths['/api/v1/blob-files']['get']['responses']['200']['content']['application/json'];

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

  const response = await fetch(`${BLOG_ADMIN_URL}/api/v1/blob-files?${params}`, {
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
