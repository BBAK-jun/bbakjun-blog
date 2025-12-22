/**
 * File Entity - Validation Schema
 *
 * Zod schemas for file entity validation
 */

import { z } from 'zod';

/**
 * File Metadata Schema
 * Validates file metadata from Blob Storage
 */
export const fileMetadataSchema = z.object({
  filename: z.string().min(1),
  pathname: z.string().min(1),
  size: z.number().nonnegative(),
  uploadedAt: z.string(),
  url: z.string().url(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  date: z.string().nullable(),
});

/**
 * File Content Schema
 * Validates complete file content with metadata
 */
export const fileContentSchema = z.object({
  rawContent: z.string(),
  htmlContent: z.string().optional(),
  frontMatter: z.record(z.string(), z.unknown()).nullable(),
  url: z.string().url(),
});

/**
 * Type Inference Exports
 */
export type FileMetadata = z.infer<typeof fileMetadataSchema>;
export type FileContent = z.infer<typeof fileContentSchema>;
