import { describe, expect, it } from 'vitest';
import {
  buildNewsletterEmail,
  canStartBroadcast,
  chunkSubscribers,
  getResumeOffset,
} from './newsletter.broadcast';

describe('newsletter broadcast helpers', () => {
  it('validates sendNewsletterBroadcast request shape through the shared route schema', async () => {
    const { newsletterBroadcastBodySchema } = await import('@/shared/api/newsletter');
    expect(
      newsletterBroadcastBodySchema.safeParse({ slug: 'DEV/example-post', force: false }).success
    ).toBe(true);
    expect(newsletterBroadcastBodySchema.safeParse({ slug: '' }).success).toBe(false);
  });

  it('blocks a sent slug unless force is explicitly enabled', () => {
    expect(canStartBroadcast({ status: 'sent' }, false)).toBe(false);
    expect(canStartBroadcast({ status: 'sent' }, true)).toBe(true);
    expect(canStartBroadcast(null, false)).toBe(true);
  });

  it('chunks recipients into 50 and resumes after the last sent subscriber', () => {
    const subscribers = Array.from({ length: 121 }, (_, index) => ({
      id: `subscriber-${index + 1}`,
      email: `user-${index + 1}@example.com`,
      unsubscribeToken: `token-${index + 1}`,
    }));
    const chunks = chunkSubscribers(subscribers, 50);
    expect(chunks.map(chunk => chunk.length)).toEqual([50, 50, 21]);
    expect(getResumeOffset(subscribers, 'subscriber-50')).toBe(50);
    expect(subscribers.slice(getResumeOffset(subscribers, 'subscriber-50'))[0]?.id).toBe(
      'subscriber-51'
    );
  });

  it('builds a per-recipient email with the unsubscribe URL', () => {
    const email = buildNewsletterEmail(
      {
        slug: 'DEV/example-post',
        title: '새 글 제목',
        description: '새 글 설명',
      },
      {
        id: 'subscriber-1',
        email: 'user@example.com',
        unsubscribeToken: 'unsubscribe-token',
      },
      'https://www.dev-bbak.site'
    );
    expect(email.to).toEqual(['user@example.com']);
    expect(email.html).toContain('https://www.dev-bbak.site/blog/DEV/example-post');
    expect(email.html).toContain(
      'https://www.dev-bbak.site/newsletter/unsubscribe?token=unsubscribe-token'
    );
  });
});
