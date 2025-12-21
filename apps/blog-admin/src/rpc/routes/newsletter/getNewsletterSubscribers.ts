import { createRoute } from '@hono/zod-openapi';
import { prisma } from '../../../shared/lib/db';
import {
  newsletterErrorSchema,
  newsletterSubscribersResponseSchema,
} from '../../../contract/schemas/newsletter';

/**
 * GET /api/rpc/getNewsletterSubscribers - 구독자 목록 조회
 * Requires admin authentication
 */
export const getNewsletterSubscribersRoute = createRoute({
  method: 'get',
  path: '/api/rpc/getNewsletterSubscribers',
  summary: 'Get newsletter subscribers list (admin)',
  description: 'Retrieve newsletter subscribers list with statistics (requires admin access)',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: newsletterSubscribersResponseSchema,
        },
      },
      description: 'Successfully retrieved subscribers list',
    },
    500: {
      content: {
        'application/json': {
          schema: newsletterErrorSchema,
        },
      },
      description: 'Internal server error',
    },
  },
});

export const getNewsletterSubscribersHandler = async (c: any) => {
  try {
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { subscribedAt: 'desc' },
      select: {
        id: true,
        email: true,
        subscribedAt: true,
        unsubscribedAt: true,
        isActive: true,
        source: true,
      },
    });

    const stats = {
      total: subscribers.length,
      active: subscribers.filter(s => s.isActive).length,
      inactive: subscribers.filter(s => !s.isActive).length,
    };

    return c.json({ subscribers, stats });
  } catch (error) {
    console.error('Subscribers list error:', error);
    return c.json(
      { error: '구독자 목록을 가져오는 중 오류가 발생했습니다' },
      500
    );
  }
};
