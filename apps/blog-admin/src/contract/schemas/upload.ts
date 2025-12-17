import { z } from 'zod';

export const uploadMarkdownResponseSchema = z.object({
  success: z.boolean(),
  path: z.string().optional(),
  url: z.string().url().optional(),
  size: z.number().optional(),
  error: z.string().optional(),
});

export const uploadImageResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url().optional(),
  pathname: z.string().optional(),
  size: z.number().optional(),
  contentType: z.string().optional(),
  error: z.string().optional(),
});

