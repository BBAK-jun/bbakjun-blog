import { z } from 'zod';

export const uploadHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().min(1).optional(),
  actionType: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
});

export const uploadHistoryItemSchema = z.object({
  id: z.string(),
  actionType: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  pathname: z.string(),
  fileUrl: z.string().url().nullable(),
  fileSize: z.number().nullable(),
  contentType: z.string().nullable(),
  uploadedBy: z.string(),
  createdAt: z.date(),
});

export const uploadHistoryResponseSchema = z.object({
  history: z.array(uploadHistoryItemSchema),
  total: z.number(),
  hasMore: z.boolean(),
});
