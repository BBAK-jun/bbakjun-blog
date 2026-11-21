import type { AppRouteHandler } from '@/rpc/libs';
import { prisma } from '@/shared/lib/db';
import { Resend } from 'resend';
import { env } from '@/env';
import { getPostBySlug } from '@repo/content';
import { getCachedBlobFiles } from '@/shared/server/blob-cdc';
import * as routes from './newsletter.routes';
import {
  buildNewsletterEmail,
  canStartBroadcast,
  chunkSubscribers,
  getResumeOffset,
} from './newsletter.broadcast';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const subscribeNewsletter: AppRouteHandler<typeof routes.subscribeNewsletter> = async c => {
  const { email, source } = c.req.valid('json');

  const existing = await prisma.subscriber.findUnique({
    where: { email },
  });

  if (existing) {
    if (existing.isActive) {
      return c.json(
        { error: '이미 구독 중인 이메일 주소입니다', message: 'Email already subscribed' },
        400
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
      200
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
      c.get('logger')?.error({ error: emailError }, 'Welcome email failed');
    }
  } else {
    c.get('logger')?.warn('RESEND_API_KEY not set, skipping welcome email');
  }

  return c.json(
    {
      message: '구독이 완료되었습니다!',
      subscriber: {
        email: subscriber.email,
        subscribedAt: subscriber.subscribedAt,
      },
    },
    200
  );
};

export const unsubscribeNewsletter: AppRouteHandler<
  typeof routes.unsubscribeNewsletter
> = async c => {
  const { token } = c.req.valid('json');

  const subscriber = await prisma.subscriber.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!subscriber) {
    return c.json({ error: '구독 정보를 찾을 수 없습니다', message: 'Subscriber not found' }, 404);
  }

  if (!subscriber.isActive) {
    return c.json({ error: '이미 구독 취소된 이메일입니다', message: 'Already unsubscribed' }, 400);
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
    200
  );
};

export const getNewsletterSubscribers: AppRouteHandler<
  typeof routes.getNewsletterSubscribers
> = async c => {
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

  const broadcasts = await prisma.newsletterBroadcast.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return c.json({ subscribers, stats, broadcasts }, 200);
};

export const sendNewsletterBroadcast: AppRouteHandler<
  typeof routes.sendNewsletterBroadcast
> = async c => {
  const {
    slug,
    title: requestedTitle,
    description: requestedDescription,
    force,
  } = c.req.valid('json');

  if (!env.RESEND_API_KEY) {
    return c.json(
      { error: 'RESEND_API_KEY is not configured', message: 'Newsletter sending is unavailable' },
      400
    );
  }

  const existing = await prisma.newsletterBroadcast.findUnique({ where: { slug } });
  if (!canStartBroadcast(existing, force)) {
    return c.json(
      { error: 'Newsletter already sent', message: 'Use force=true to resend this slug' },
      409
    );
  }

  const blobResult = await getCachedBlobFiles({ limit: 10000, offset: 0 });
  const post = await getPostBySlug(
    blobResult.files.map(file => ({
      url: file.url,
      pathname: file.pathname,
      contentType: file.contentType,
    })),
    slug
  );

  if (!post || post.frontMatter.draft === true) {
    return c.json(
      { error: 'Published post not found', message: `No published post found for slug: ${slug}` },
      404
    );
  }

  const title = requestedTitle || post.frontMatter.title;
  const description = requestedDescription || post.frontMatter.description || '';
  const broadcast = existing
    ? force
      ? await prisma.newsletterBroadcast.update({
          where: { id: existing.id },
          data: {
            title,
            status: 'pending',
            sentAt: null,
            recipientCount: 0,
            failedCount: 0,
            lastSentSubscriberId: null,
          },
        })
      : existing
    : await prisma.newsletterBroadcast.create({
        data: { slug, title, status: 'pending' },
      });

  const subscribers = await prisma.subscriber.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
    select: { id: true, email: true, unsubscribeToken: true },
  });

  await prisma.newsletterBroadcast.update({
    where: { id: broadcast.id },
    data: { status: 'sending', title },
  });

  const offset = getResumeOffset(subscribers, broadcast.lastSentSubscriberId);
  const remainingSubscribers = subscribers.slice(offset);
  const resend = new Resend(env.RESEND_API_KEY);
  let sent = broadcast.recipientCount;
  let failed = broadcast.failedCount;

  if (remainingSubscribers.length === 0) {
    const completed = await prisma.newsletterBroadcast.update({
      where: { id: broadcast.id },
      data: { status: 'sent', sentAt: broadcast.sentAt ?? new Date() },
    });
    return c.json(
      {
        broadcastId: completed.id,
        status: completed.status,
        sent,
        failed,
        remaining: 0,
      },
      200
    );
  }

  for (const chunk of chunkSubscribers(remainingSubscribers, 50)) {
    try {
      const result = await resend.batch.send(
        chunk.map(subscriber =>
          buildNewsletterEmail({ slug, title, description }, subscriber, env.NEXT_PUBLIC_BLOG_URL)
        )
      );
      if (result.error) throw result.error;

      const lastSubscriber = chunk[chunk.length - 1];
      sent += chunk.length;
      await prisma.newsletterBroadcast.update({
        where: { id: broadcast.id },
        data: {
          status: 'sending',
          recipientCount: sent,
          lastSentSubscriberId: lastSubscriber.id,
        },
      });
    } catch (error) {
      failed += chunk.length;
      c.get('logger')?.error({ error, slug, broadcastId: broadcast.id }, 'Newsletter batch failed');
      const failedBroadcast = await prisma.newsletterBroadcast.update({
        where: { id: broadcast.id },
        data: { status: 'failed', failedCount: failed },
      });
      return c.json(
        {
          broadcastId: failedBroadcast.id,
          status: failedBroadcast.status,
          sent,
          failed,
          remaining: subscribers.length - offset,
        },
        200
      );
    }
  }

  const completed = await prisma.newsletterBroadcast.update({
    where: { id: broadcast.id },
    data: { status: 'sent', sentAt: new Date(), recipientCount: sent, failedCount: failed },
  });

  return c.json(
    {
      broadcastId: completed.id,
      status: completed.status,
      sent,
      failed,
      remaining: 0,
    },
    200
  );
};
