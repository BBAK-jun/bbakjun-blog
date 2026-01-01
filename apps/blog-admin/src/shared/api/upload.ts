import { z } from 'zod';

// Request schemas
export const uploadMarkdownRequestSchema = z.object({
  file: z.instanceof(File),
  path: z.string().min(1),
});

export const uploadImageRequestSchema = z.object({
  file: z.instanceof(File),
  pathname: z.string().optional(),
});

export const uploadMultipleImagesRequestSchema = z.object({
  files: z.array(z.instanceof(File)).min(1),
  pathname: z.string().optional(),
});

// Response schemas
export const uploadMarkdownResponseSchema = z.object({
  success: z.boolean(),
  path: z.string(),
  url: z.string().url(),
  size: z.number(),
});

export const uploadImageResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url(),
  pathname: z.string(),
  size: z.number(),
  contentType: z.string(),
});

export const uploadMultipleImagesResponseSchema = z.object({
  success: z.boolean(),
  results: z.array(
    z.object({
      success: z.boolean(),
      url: z.string().url().optional(),
      pathname: z.string().optional(),
      size: z.number().optional(),
      contentType: z.string().optional(),
      error: z.string().optional(),
      filename: z.string(),
    })
  ),
  total: z.number(),
  uploaded: z.number(),
  failed: z.number(),
});

// Error schemas
export const uploadErrorSchema = z.object({
  success: z.boolean(),
  error: z.string(),
});
