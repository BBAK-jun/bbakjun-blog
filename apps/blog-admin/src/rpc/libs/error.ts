import { z } from '@hono/zod-openapi';

export const InternalServerErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export const BadRequestErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export const UnauthorizedErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export const NotFoundErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export type InternalServerError = z.infer<typeof InternalServerErrorSchema>;
export type BadRequestError = z.infer<typeof BadRequestErrorSchema>;
export type UnauthorizedError = z.infer<typeof UnauthorizedErrorSchema>;
export type NotFoundError = z.infer<typeof NotFoundErrorSchema>;
