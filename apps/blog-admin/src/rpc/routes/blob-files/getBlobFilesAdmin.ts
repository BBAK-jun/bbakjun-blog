import { createRoute } from '@hono/zod-openapi';
import {
  getCachedBlobFiles,
  needsSync,
  syncBlobToDatabase,
} from '../../../shared/server/blob-cdc';
import {
  adminBlobFilesQuerySchema,
  blobFilesErrorSchema,
  blobFilesResponseSchema,
} from '../../../shared/api/blob-files';

/**
 * GET /api/rpc/getBlobFilesAdmin - 관리자 Blob 파일 목록 조회 (자동 동기화 지원)
 * Requires authentication
 */
export const getBlobFilesAdminRoute = createRoute({
  method: 'get',
  path: '/api/rpc/getBlobFilesAdmin',
  summary: 'Get blob files list (admin)',
  description: 'Retrieve blob files from CDC cache with auto-sync support (requires authentication)',
  request: {
    query: adminBlobFilesQuerySchema,
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

export const getBlobFilesAdminHandler = async (c: any) => {
  try {
    const { limit, offset, search: searchTerm, autoSync } = c.req.valid('query');

    if (autoSync && (await needsSync())) {
      console.log('🔄 Auto-syncing Blob files...');
      await syncBlobToDatabase();
    }

    const result = await getCachedBlobFiles({ limit, offset, searchTerm });

    return c.json(result, 200);
  } catch (error) {
    console.error('Blob files list error:', error);
    return c.json(
      { error: 'Failed to fetch blob files' },
      500
    );
  }
};
