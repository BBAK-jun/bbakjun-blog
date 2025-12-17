import { Hono } from 'hono';
import { Resend } from 'resend';
import { prisma } from '../../shared/lib/db';
import type { RpcEnv } from '../env';
import { requireAdminSession } from '../middleware/session';
import {
  newsletterErrorSchema,
  newsletterSubscribeBodySchema,
  newsletterUnsubscribeBodySchema,
} from '../../contract/schemas/newsletter';
import { env } from '../../env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const corsHeaders = {
  'Access-Control-Allow-Origin': env.NEXT_PUBLIC_BLOG_URL || 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const newsletterRoutes = new Hono<RpcEnv>()
  .options('*', () => new Response(null, { status: 200, headers: corsHeaders }))
  .post('/subscribe', async c => {
    try {
      const body = await c.req.json();
      const parsed = newsletterSubscribeBodySchema.safeParse(body);
      if (!parsed.success) {
        return c.json(
          newsletterErrorSchema.parse({ error: parsed.error.issues[0].message }),
          400,
          corsHeaders
        );
      }

      const { email, source } = parsed.data;

      const existing = await prisma.subscriber.findUnique({
        where: { email },
      });

      if (existing) {
        if (existing.isActive) {
          return c.json(
            newsletterErrorSchema.parse({
              error: '이미 구독 중인 이메일 주소입니다',
            }),
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
        newsletterErrorSchema.parse({ error: '구독 처리 중 오류가 발생했습니다' }),
        500,
        corsHeaders
      );
    }
  })
  .post('/unsubscribe', async c => {
    try {
      const body = await c.req.json();
      const parsed = newsletterUnsubscribeBodySchema.safeParse(body);
      if (!parsed.success) {
        return c.json(
          newsletterErrorSchema.parse({ error: parsed.error.issues[0].message }),
          400,
          corsHeaders
        );
      }

      const { token } = parsed.data;

      const subscriber = await prisma.subscriber.findUnique({
        where: { unsubscribeToken: token },
      });

      if (!subscriber) {
        return c.json(
          newsletterErrorSchema.parse({ error: '구독 정보를 찾을 수 없습니다' }),
          404,
          corsHeaders
        );
      }

      if (!subscriber.isActive) {
        return c.json(
          newsletterErrorSchema.parse({
            error: '이미 구독 취소된 이메일입니다',
          }),
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
        newsletterErrorSchema.parse({ error: '구독 취소 중 오류가 발생했습니다' }),
        500,
        corsHeaders
      );
    }
  })
  .use('/subscribers*', requireAdminSession)
  .get('/subscribers', async c => {
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
  });
