import { createRoute } from '@hono/zod-openapi';
import { ViewCounter } from '@repo/analytics';
import {
  viewsSlugParamSchema,
  viewsGetResponseSchema,
  viewsErrorSchema,
} from '../../../contract/schemas/views';

/**
 * GET /api/v1/views/:slug - 조회수 조회
 */
export const getViewsBySlugRoute = createRoute({
  method: 'get',
  path: '/api/rpc/getViewsBySlug/:slug',
  summary: 'Get view count by slug',
  description: 'Retrieve view count for a specific post',
  request: {
    params: viewsSlugParamSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: viewsGetResponseSchema,
        },
      },
      description: 'Successfully retrieved view count',
    },
    400: {
      content: {
        'application/json': {
          schema: viewsErrorSchema,
        },
      },
      description: 'Invalid slug parameter',
    },
    500: {
      content: {
        'application/json': {
          schema: viewsErrorSchema,
        },
      },
      description: 'Internal server error',
    },
  },
});

export const getViewsBySlugHandler = async (c: any) => {
  try {
    const { slug } = c.req.valid('param');

    const views = await ViewCounter.get(slug);

    return c.json(
      { slug, views },
      200,
      {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    );
  } catch (error) {
    console.error('Error getting view count:', error);
    return c.json(
      { error: 'Failed to get view count' },
      500
    );
  }
};
