import { z } from 'zod';

export const newsletterSubscribeBodySchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

export const newsletterUnsubscribeBodySchema = z.object({
  token: z.string().min(1),
});

export const newsletterErrorSchema = z.object({
  error: z.string(),
});

