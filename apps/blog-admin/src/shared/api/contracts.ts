// Export all schemas for backward compatibility
export * from './upload';
export * from './blob-files';
export * from './views';
export * from './newsletter';

// Common schemas
import { z } from 'zod';

export const errorResponseSchema = z.object({
  error: z.string(),
});

export type ErrorResponse = {
  error: string;
};
