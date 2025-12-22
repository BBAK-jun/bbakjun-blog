import { createRoute } from '@hono/zod-openapi';
import { ViewCounter } from '@repo/analytics';
import {
  viewsSlugParamSchema,
  viewsIncrementBodySchema,
  viewsIncrementResponseSchema,
  viewsErrorSchema,
} from '../../../shared/api/views';

/**
 * POST /api/v1/views/:slug - 조회수 증가
 */
export const incrementViewsBySlugRoute = createRoute({
  method: 'post',
  path: '/api/rpc/incrementViewsBySlug/:slug',
  summary: 'Increment view count by slug',
  description: 'Increment view count for a specific post with session-based deduplication',
  request: {
    params: viewsSlugParamSchema,
    body: {
      content: {
        'application/json': {
          schema: viewsIncrementBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: viewsIncrementResponseSchema,
        },
      },
      description: 'Successfully incremented view count',
    },
    400: {
      content: {
        'application/json': {
          schema: viewsErrorSchema,
        },
      },
      description: 'Invalid parameters',
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

export const incrementViewsBySlugHandler = async (c: any) => {
  try {
    const { slug } = c.req.valid('param');
    const { sessionId, userAgent } = c.req.valid('json');

    // 봇이나 크롤러 제외
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i,
      /pinterest/i,
    ];

    const isBot = botPatterns.some((pattern) => pattern.test(userAgent));

    if (isBot) {
      const views = await ViewCounter.get(slug);
      return c.json(
        {
          slug,
          views,
          incremented: false,
        }
      );
    }

    // 세션 ID가 있으면 세션 기반 증가, 없으면 일반 증가
    let views: number;
    let incremented: boolean;

    if (sessionId) {
      [views, incremented] = await ViewCounter.incrementWithSession(
        sessionId,
        slug
      );
    } else {
      views = await ViewCounter.increment(slug);
      incremented = true;
    }

    return c.json(
      { slug, views, incremented },
      200,
      {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    );
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return c.json(
      { error: 'Failed to increment view count' },
      500
    );
  }
};
