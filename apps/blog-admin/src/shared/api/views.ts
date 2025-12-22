import { z } from 'zod';

// Path params
export const viewsSlugParamSchema = z.object({
  slug: z.string().min(1),
});

// GET /api/v1/views/:slug
export const viewsGetQuerySchema = z.object({
  slug: z.string().min(1),
});

export const viewsGetResponseSchema = z.object({
  slug: z.string(),
  views: z.number().int().min(0),
});

// POST /api/v1/views/:slug
export const viewsIncrementBodySchema = z.object({
  sessionId: z.string().optional(),
  userAgent: z.string().default('unknown'),
});

export const viewsIncrementResponseSchema = z.object({
  slug: z.string(),
  views: z.number().int().min(0),
  incremented: z.boolean(),
});

// GET /api/v1/views/stats
export const popularPostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  views: z.number().int().min(0),
  date: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
});

export const viewsStatsResponseSchema = z.object({
  totalViews: z.number().int().min(0),
  totalPosts: z.number().int().min(0),
  averageViews: z.number().int().min(0),
  popularPosts: z.array(popularPostSchema),
  recentPosts: z.array(popularPostSchema),
});

export const viewsErrorSchema = z.object({
  error: z.string(),
});
