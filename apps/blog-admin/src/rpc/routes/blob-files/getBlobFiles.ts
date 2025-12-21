import { createRoute } from '@hono/zod-openapi';
import { getCachedBlobFiles } from '../../../lib/blob-cdc';
import {
  blobFilesQuerySchema,
  blobFilesErrorSchema,
  blobFilesResponseSchema,
} from '../../../contract/schemas/blob-files';

/**
 * GET /api/rpc/getBlobFiles - 공개 Blob 파일 목록 조회 (CDC 캐시)
 */
export const getBlobFilesRoute = createRoute({
  method: 'get',
  path: '/api/rpc/getBlobFiles',
  summary: 'Get blob files list (public)',
  description: 'Retrieve blob files from CDC cache (public access)',
  request: {
    query: blobFilesQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: blobFilesResponseSchema,
        },
      },
      description: 'Successfully retrieved blob files',
    },
    400: {
      content: {
        'application/json': {
          schema: blobFilesErrorSchema,
        },
      },
      description: 'Invalid request parameters',
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

export const getBlobFilesHandler = async (c: any) => {
  try {
    const { limit, offset, search: searchTerm } = c.req.valid('query');
    const result = await getCachedBlobFiles({ limit, offset, searchTerm });

    return c.json(result, 200);
  } catch (error) {
    console.error('Public blob files list error:', error);
    return c.json(
      { error: 'Failed to fetch blob files' },
      500
    );
  }
};
