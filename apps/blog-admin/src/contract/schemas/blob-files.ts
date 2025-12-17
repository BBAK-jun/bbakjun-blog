import { z } from 'zod';

export const blobFilesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(1000),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().min(1).optional(),
});

export const adminBlobFilesQuerySchema = blobFilesQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  autoSync: z.coerce.boolean().default(true),
});

export const blobFileSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  pathname: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
  contentType: z.string().nullable(),
  syncedAt: z.string(),
  lastChecked: z.string(),
  isDeleted: z.boolean(),
  uploadedBy: z.string().nullable(),
});

export const blobFilesResponseSchema = z.object({
  files: z.array(blobFileSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export const blobFilesErrorSchema = z.object({
  error: z.string(),
});

