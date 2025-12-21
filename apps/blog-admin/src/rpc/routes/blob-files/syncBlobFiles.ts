import { createRoute, z } from '@hono/zod-openapi';
import { syncBlobToDatabase } from '../../../lib/blob-cdc';
import { blobFilesErrorSchema } from '../../../contract/schemas/blob-files';

const syncBlobFilesResponseSchema = z.object({
  message: z.string(),
  stats: z.object({
    added: z.number(),
    updated: z.number(),
    deleted: z.number(),
    total: z.number(),
  }),
});

/**
 * POST /api/rpc/syncBlobFiles - 수동 Blob 파일 동기화
 * Requires admin authentication
 */
export const syncBlobFilesRoute = createRoute({
  method: 'post',
  path: '/api/rpc/syncBlobFiles',
  summary: 'Sync blob files manually',
  description: 'Manually trigger blob files synchronization (requires admin authentication)',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: syncBlobFilesResponseSchema,
        },
      },
      description: 'Successfully synced blob files',
    },
    401: {
      content: {
        'application/json': {
          schema: blobFilesErrorSchema,
        },
      },
      description: 'Unauthorized',
    },
    500: {
      content: {
        'application/json': {
          schema: blobFilesErrorSchema,
        },
      },
      description: 'Internal server error',
    },
  },
});

export const syncBlobFilesHandler = async (c: any) => {
  try {
    const stats = await syncBlobToDatabase();

    return c.json({
      message: 'Sync completed',
      stats,
    }, 200);
  } catch (error) {
    console.error('Blob sync error:', error);
    return c.json(
      { error: 'Failed to sync blob files' },
      500
    );
  }
};
