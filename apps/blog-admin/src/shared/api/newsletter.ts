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
});
