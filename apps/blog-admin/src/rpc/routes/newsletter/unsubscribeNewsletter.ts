import { createRoute } from '@hono/zod-openapi';
import { prisma } from '../../../shared/lib/db';
import {
  newsletterErrorSchema,
  newsletterUnsubscribeBodySchema,
  newsletterUnsubscribeResponseSchema,
} from '../../../contract/schemas/newsletter';
import { env } from '../../../env';

const corsHeaders = {
  'Access-Control-Allow-Origin': env.NEXT_PUBLIC_BLOG_URL || 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * POST /api/rpc/unsubscribeNewsletter - 뉴스레터 구독 취소
 */
export const unsubscribeNewsletterRoute = createRoute({
  method: 'post',
  path: '/api/rpc/unsubscribeNewsletter',
  summary: 'Unsubscribe from newsletter',
  description: 'Unsubscribe from the newsletter using token',
  request: {
    body: {
      content: {
        'application/json': {
          schema: newsletterUnsubscribeBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: newsletterUnsubscribeResponseSchema,
        },
      },
      description: 'Successfully unsubscribed from newsletter',
    },
    400: {
      content: {
        'application/json': {
          schema: newsletterErrorSchema,
        },
      },
      description: 'Invalid request or already unsubscribed',
    },
    404: {
      content: {
        'application/json': {
          schema: newsletterErrorSchema,
        },
      },
      description: 'Subscriber not found',
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

export const unsubscribeNewsletterHandler = async (c: any) => {
  try {
    const { token } = c.req.valid('json');

    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return c.json(
        { error: '구독 정보를 찾을 수 없습니다' },
        404,
        corsHeaders
      );
    }

    if (!subscriber.isActive) {
      return c.json(
        { error: '이미 구독 취소된 이메일입니다' },
        400,
        corsHeaders
      );
    }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    return c.json(
      {
        message: '구독이 취소되었습니다',
        email: subscriber.email,
      },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return c.json(
      { error: '구독 취소 중 오류가 발생했습니다' },
      500,
      corsHeaders
    );
  }
};
