/**
 * File API Service - Shared types and utilities
 *
 * IMPORTANT: This module should NOT import server-only code (Prisma, blob-cdc).
 * Server actions are implemented in app/actions/files.ts.
 * Client-side code should use server actions via queries.ts.
 */

import { processMarkdown } from '@repo/content';
import {
  type CreateFileInput,
  type UpdateFileInput,
} from '@/shared/lib/schemas/file.schema';

// Re-export types for convenience
export type { CreateFileInput, UpdateFileInput };

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
 * Preview markdown content without saving
 * This is safe to use on client-side (no server dependencies)
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

// NOTE: Server-only functions (createFile, updateFile, deleteFile, listFiles, getFileContent)
// are implemented in app/actions/files.ts as Next.js server actions.
// This prevents server-only modules from being bundled into client code.
