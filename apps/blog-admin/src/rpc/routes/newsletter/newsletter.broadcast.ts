export type BroadcastSubscriber = {
  id: string;
  email: string;
  unsubscribeToken: string;
};

export type BroadcastContent = {
  slug: string;
  title: string;
  description: string;
};

export type BroadcastEmail = {
  from: string;
  to: string[];
  subject: string;
  html: string;
};

export function canStartBroadcast(existing: { status: string } | null, force: boolean): boolean {
  return !existing || existing.status !== 'sent' || force;
}

export function chunkSubscribers<T>(items: T[], size: number): T[][] {
  if (size <= 0) throw new Error('Chunk size must be greater than zero');
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function getResumeOffset(
  subscribers: BroadcastSubscriber[],
  lastSentSubscriberId: string | null | undefined
): number {
  if (!lastSentSubscriberId) return 0;
  const index = subscribers.findIndex(subscriber => subscriber.id === lastSentSubscriberId);
  return index === -1 ? 0 : index + 1;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildNewsletterEmail(
  content: BroadcastContent,
  subscriber: BroadcastSubscriber,
  blogUrl: string
): BroadcastEmail {
  const postUrl = `${blogUrl}/blog/${content.slug}`;
  const unsubscribeUrl = `${blogUrl}/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`;
  return {
    from: 'DEV_BBAK 블로그 <noreply@dev-bbak.site>',
    to: [subscriber.email],
    subject: content.title,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>${escapeHtml(content.title)}</h1>
        <p>${escapeHtml(content.description)}</p>
        <p><a href="${postUrl}" style="color: #2563eb;">글 읽으러 가기</a></p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 14px; color: #6b7280;">
          더 이상 이메일을 받고 싶지 않으시면
          <a href="${unsubscribeUrl}" style="color: #2563eb;">구독을 취소할 수 있어요.</a>
        </p>
      </div>
    `,
  };
}
