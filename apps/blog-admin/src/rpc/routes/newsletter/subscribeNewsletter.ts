import { createRoute } from '@hono/zod-openapi';
import { Resend } from 'resend';
import { prisma } from '../../../shared/lib/db';
import {
  newsletterErrorSchema,
  newsletterSubscribeBodySchema,
  newsletterSubscribeResponseSchema,
} from '../../../contract/schemas/newsletter';
import { env } from '../../../env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const corsHeaders = {
  'Access-Control-Allow-Origin': env.NEXT_PUBLIC_BLOG_URL || 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * POST /api/rpc/subscribeNewsletter - 뉴스레터 구독
 */
export const subscribeNewsletterRoute = createRoute({
  method: 'post',
  path: '/api/rpc/subscribeNewsletter',
  summary: 'Subscribe to newsletter',
  description: 'Subscribe to the newsletter with email',
  request: {
    body: {
      content: {
        'application/json': {
          schema: newsletterSubscribeBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: newsletterSubscribeResponseSchema,
        },
      },
      description: 'Successfully subscribed to newsletter',
    },
    400: {
      content: {
        'application/json': {
          schema: newsletterErrorSchema,
        },
      },
      description: 'Invalid request or already subscribed',
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

export const subscribeNewsletterHandler = async (c: any) => {
  try {
    const { email, source } = c.req.valid('json');

    const existing = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.isActive) {
        return c.json(
          { error: '이미 구독 중인 이메일 주소입니다' },
          400,
          corsHeaders
        );
      }

      await prisma.subscriber.update({
        where: { email },
        data: {
          isActive: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
          source,
        },
      });

      return c.json(
        {
          message: '구독이 재활성화되었습니다',
          reactivated: true,
        },
        200,
        corsHeaders
      );
    }

    const subscriber = await prisma.subscriber.create({
      data: {
        email,
        source: source || 'website',
      },
    });

    if (resend) {
      try {
        await resend.emails.send({
          from: 'DEV_BBAK 블로그 <noreply@dev-bbak.site>',
          to: email,
          subject: 'DEV_BBAK 블로그 구독을 환영합니다! 🎉',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">구독해주셔서 감사합니다!</h1>
              <p>안녕하세요,</p>
              <p>DEV_BBAK 블로그 뉴스레터 구독을 환영합니다.</p>
              <p>새로운 포스트가 발행되면 이메일로 알려드리겠습니다.</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
              <p style="font-size: 14px; color: #6b7280;">
                더 이상 이메일을 받고 싶지 않으시면
                <a href="${env.NEXT_PUBLIC_BLOG_URL}/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}"
                   style="color: #2563eb;">여기</a>를 클릭하여 구독을 취소할 수 있습니다.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Welcome email failed:', emailError);
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not set, skipping welcome email');
    }

    return c.json(
      {
        message: '구독이 완료되었습니다!',
        subscriber: {
          email: subscriber.email,
          subscribedAt: subscriber.subscribedAt,
        },
      },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error('Subscribe error:', error);
    return c.json(
      { error: '구독 처리 중 오류가 발생했습니다' },
      500,
      corsHeaders
    );
  }
};
