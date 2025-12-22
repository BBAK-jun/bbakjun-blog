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

// Error schemas
export const uploadErrorSchema = z.object({
  success: z.boolean(),
  error: z.string(),
});
