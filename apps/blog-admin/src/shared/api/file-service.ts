/**
 * File API Service - Shared service for file operations
 * This service provides a clean interface for file operations without
 * depending on Next.js app actions, making it usable across all FSD layers.
 */

import { processMarkdown } from '@repo/content';
import matter from 'gray-matter';
import {
  createFileSchema,
  updateFileSchema,
  type CreateFileInput,
  type UpdateFileInput,
} from '@/shared/lib/schemas/file.schema';

// Re-export types for convenience
export type { CreateFileInput, UpdateFileInput };
import { revalidateBlogPost } from '@/shared/lib/revalidate-blog';
import { getCachedBlobFiles, onBlobUpload, onBlobDelete } from '@/shared/server/blob-cdc';
import { env } from '@/shared/config';
import { put, del } from '@vercel/blob';
import type { PutBlobResult } from '@vercel/blob';

const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN;

/**
 * Base file metadata interface
 */
export interface FileMetadata {
  pathname: string;
  size: number;
  uploadedAt: string;
  url: string;
}

/**
 * File content with metadata and processed HTML
 * This matches the entity layer expectations
 */
export interface FileContent {
  rawContent: string;
  htmlContent: string;
  frontMatter: Record<string, any> | null;
  metadata: FileMetadata;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get file content and metadata from Blob Storage
 */
export async function getFileContent(pathname: string): Promise<ApiResponse<FileContent>> {
  try {
    // Use CDC cached file list instead of direct Blob API call
    const { files } = await getCachedBlobFiles();

    const blob = files.find(f => f.pathname === pathname);

    if (!blob) {
      return {
        success: false,
        error: `File not found in Blob Storage: ${pathname}`,
      };
    }

    // Fetch content using the blob's URL with no-cache to ensure fresh data
    const response = await fetch(blob.url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch file: ${response.statusText}`,
      };
    }

    const rawContent = await response.text();

    // Parse front matter
    const { data: frontMatter, content } = matter(rawContent);

    // Process markdown to HTML
    const htmlContent = await processMarkdown(content);

    return {
      success: true,
      data: {
        rawContent,
        htmlContent,
        frontMatter,
        metadata: {
          pathname,
          size: Number(blob.size),
          uploadedAt: blob.uploadedAt.toISOString(),
          url: blob.url,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file content',
    };
  }
}

/**
 * Create a new file
 */
export async function createFile(
  input: CreateFileInput
): Promise<ApiResponse<{ pathname: string }>> {
  try {
    // Validate input
    const validatedInput = createFileSchema.parse(input);

    // Generate file content with front matter
    const frontMatter = {
      title: validatedInput.title,
      date: validatedInput.date,
      description: validatedInput.description,
      tags: validatedInput.tags,
      author: validatedInput.author,
      draft: validatedInput.draft,
      ...(validatedInput.series && { series: validatedInput.series }),
      ...(validatedInput.seriesOrder && { seriesOrder: validatedInput.seriesOrder }),
    };

    const fileContent = matter.stringify(validatedInput.content, frontMatter);

    // Upload to Vercel Blob
    const blob: PutBlobResult = await put(validatedInput.pathname, fileContent, {
      access: 'public',
      token: BLOB_TOKEN,
      contentType: 'text/markdown',
      addRandomSuffix: false, // Critical: prevents duplicate files on update
    });

    // Track in CDC database
    await onBlobUpload({
      url: blob.url,
      pathname: blob.pathname,
      size: new Blob([fileContent]).size, // Calculate size from content
      contentType: blob.contentType || undefined,
      uploadedAt: new Date(),
    });

    // Revalidate blog post if not draft
    if (!validatedInput.draft) {
      const revalidateResult = await revalidateBlogPost(validatedInput.pathname);
      if (!revalidateResult.success) {
        console.warn(`Failed to revalidate blog post: ${revalidateResult.error}`);
      }
    }

    return {
      success: true,
      data: {
        pathname: blob.pathname,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create file',
    };
  }
}

/**
 * Update an existing file
 */
export async function updateFile(
  input: UpdateFileInput
): Promise<ApiResponse<{ pathname: string }>> {
  try {
    // Validate input
    const validatedInput = updateFileSchema.parse(input);

    // Get existing file content
    const existingFileResult = await getFileContent(validatedInput.pathname);
    if (!existingFileResult.success || !existingFileResult.data) {
      return {
        success: false,
        error: existingFileResult.error || 'Failed to get existing file',
      };
    }

    // Parse existing front matter
    const { data: existingFrontMatter } = matter(existingFileResult.data.rawContent);

    // Merge with new data
    const updatedFrontMatter = {
      ...existingFrontMatter,
      title: validatedInput.title,
      date: validatedInput.date,
      description: validatedInput.description,
      tags: validatedInput.tags,
      author: validatedInput.author,
      draft: validatedInput.draft,
      ...(validatedInput.series !== undefined && { series: validatedInput.series }),
      ...(validatedInput.seriesOrder !== undefined && { seriesOrder: validatedInput.seriesOrder }),
    };

    // Generate updated file content
    const fileContent = matter.stringify(validatedInput.content, updatedFrontMatter);

    // Upload to Vercel Blob (overwrite existing)
    const blob: PutBlobResult = await put(validatedInput.pathname, fileContent, {
      access: 'public',
      token: BLOB_TOKEN,
      contentType: 'text/markdown',
      addRandomSuffix: false, // Critical: prevents duplicate files on update
    });

    // Track in CDC database
    await onBlobUpload({
      url: blob.url,
      pathname: blob.pathname,
      size: new Blob([fileContent]).size, // Calculate size from content
      contentType: blob.contentType || undefined,
      uploadedAt: new Date(),
    });

    // Revalidate blog post if not draft
    if (!validatedInput.draft) {
      const revalidateResult = await revalidateBlogPost(validatedInput.pathname);
      if (!revalidateResult.success) {
        console.warn(`Failed to revalidate blog post: ${revalidateResult.error}`);
      }
    }

    return {
      success: true,
      data: {
        pathname: blob.pathname,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update file',
    };
  }
}

/**
 * Delete a file
 */
export async function deleteFile(pathname: string): Promise<ApiResponse> {
  try {
    // Use CDC cached file list to get file info
    const { files } = await getCachedBlobFiles();
    const blob = files.find(f => f.pathname === pathname);

    if (!blob) {
      return {
        success: false,
        error: `File not found: ${pathname}`,
      };
    }

    // Delete from Vercel Blob
    await del(blob.url, { token: BLOB_TOKEN });

    // Track deletion in CDC database
    await onBlobDelete(blob.pathname);

    // Revalidate to remove from static cache
    const revalidateResult = await revalidateBlogPost(pathname);
    if (!revalidateResult.success) {
      console.warn(`Failed to revalidate blog post: ${revalidateResult.error}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}

/**
 * List files from CDC cache
 */
export async function listFiles(
  limit?: number
): Promise<ApiResponse<{ files: any[]; total: number; hasMore: boolean }>> {
  try {
    const result = await getCachedBlobFiles({ limit: limit || 100 });

    return {
      success: true,
      data: {
        files: result.files,
        total: result.total,
        hasMore: result.hasMore,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    };
  }
}

/**
 * Preview markdown content without saving
 */
export async function previewMarkdown(
  content: string
): Promise<ApiResponse<{ htmlContent: string }>> {
  try {
    if (!content.trim()) {
      return {
        success: false,
        error: 'Content cannot be empty',
      };
    }

    const htmlContent = await processMarkdown(content);

    return {
      success: true,
      data: {
        htmlContent,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview markdown',
    };
  }
}
