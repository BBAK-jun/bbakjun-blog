import { z } from 'zod';

// Request schemas
export const newsletterSubscribeBodySchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

export const newsletterUnsubscribeBodySchema = z.object({
  token: z.string().min(1),
});

// Response schemas
export const newsletterErrorSchema = z.object({
  error: z.string(),
});

export const newsletterSubscribeResponseSchema = z.object({
  message: z.string(),
  subscriber: z
    .object({
      email: z.string(),
      subscribedAt: z.coerce.date(),
    })
    .optional(),
  reactivated: z.boolean().optional(),
});

export const newsletterUnsubscribeResponseSchema = z.object({
  message: z.string(),
  email: z.string(),
});

export const newsletterSubscriberSchema = z.object({
  id: z.string(),
  email: z.string(),
  subscribedAt: z.coerce.date(),
  unsubscribedAt: z.coerce.date().nullable(),
  isActive: z.boolean(),
  source: z.string().nullable(),
});

export const newsletterStatsSchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
});

export const newsletterSubscribersResponseSchema = z.object({
  subscribers: z.array(newsletterSubscriberSchema),
  stats: newsletterStatsSchema,
  broadcasts: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string(),
        title: z.string(),
        sentAt: z.coerce.date().nullable(),
        recipientCount: z.number(),
        failedCount: z.number(),
        status: z.string(),
        lastSentSubscriberId: z.string().nullable(),
        createdAt: z.coerce.date(),
      })
    )
    .default([]),
});

export const newsletterBroadcastBodySchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  force: z.boolean().default(false),
});

export const newsletterBroadcastResponseSchema = z.object({
  broadcastId: z.string(),
  status: z.string(),
  sent: z.number(),
  failed: z.number(),
  remaining: z.number(),
});
