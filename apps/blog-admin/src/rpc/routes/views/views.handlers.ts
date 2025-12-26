import type { AppRouteHandler } from '@/rpc/libs';
import { getCachedBlobFiles } from '@/shared/server/blob-cdc';
import { ViewCounter } from '@repo/analytics';
import { getAllPosts } from '@repo/content';
import { cachedQuery, CacheKeys } from '@repo/cache';
import * as routes from './views.routes';

export const getViewsBySlug: AppRouteHandler<typeof routes.getViewsBySlug> = async c => {
  const { slug } = c.req.valid('query');
  const views = await ViewCounter.get(slug);
  return c.json({ slug, views }, 200, {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  });
};

export const incrementViewsBySlug: AppRouteHandler<
  typeof routes.incrementViewsBySlug
> = async c => {
  const { slug } = c.req.valid('query');

  console.log('slug', slug);

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

  const isBot = botPatterns.some(pattern => pattern.test(userAgent));

  if (isBot) {
    const views = await ViewCounter.get(slug);
    return c.json(
      {
        slug,
        views,
        incremented: false,
      },
      200
    );
  }

  let views: number;
  let incremented: boolean;

  if (sessionId) {
    [views, incremented] = await ViewCounter.incrementWithSession(sessionId, slug);
  } else {
    views = await ViewCounter.increment(slug);
    incremented = true;
  }

  return c.json({ slug, views, incremented }, 200, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
};

export const getViewsStats: AppRouteHandler<typeof routes.getViewsStats> = async c => {
  const logger = c.get('logger');
  logger?.info('[stats] RPC API 호출 시작');

  const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error('Operation timed out after ' + timeoutMs + 'ms')),
          timeoutMs
        )
      ),
    ]);
  };

  // Redis 캐싱 적용 - 3분 TTL
  const { data: stats } = await cachedQuery({
    key: CacheKeys.viewsStats(),
    ttl: 180, // 3분
    query: async () => {
      const { files } = await getCachedBlobFiles({ limit: 1000, offset: 0 });
      const blobFiles = files.map(f => ({
        url: f.url,
        pathname: f.pathname,
        contentType: f.contentType || null,
      }));
      const posts = await getAllPosts(blobFiles);
      logger?.info('[stats] ' + posts.length + '개 포스트 로드 완료');

      let popularPosts: Array<{ slug: string; views: number }> = [];
      let totalViews = 0;

      try {
        logger?.info('[stats] 인기글 조회 시작');
        popularPosts = await withTimeout(ViewCounter.getPopularPosts(10), 10000);
        logger?.info('[stats] 인기글 ' + popularPosts.length + '개 조회 완료');
      } catch (error) {
        logger?.error({ error }, '[stats] 인기글 조회 실패');
        popularPosts = [];
      }

      try {
        logger?.info('[stats] 총 조회수 계산 시작');
        totalViews = await withTimeout(ViewCounter.getTotalViews(), 8000);
        logger?.info('[stats] 총 조회수 ' + totalViews + ' 계산 완료');
      } catch (error) {
        logger?.error({ error }, '[stats] 총 조회수 계산 실패');
        totalViews = popularPosts.reduce((sum, post) => sum + post.views, 0);
      }

      const enrichedPopularPosts = popularPosts
        .map(({ slug, views }) => {
          const post = posts.find(p => p.slug === slug);
          return {
            slug,
            title: post?.frontMatter.title || slug,
            views,
            date: post?.frontMatter.date || '',
            description: post?.frontMatter.description || undefined,
            tags: post?.frontMatter.tags || undefined,
            readingTime: post?.readingTime || undefined,
          };
        })
        .filter(post => post.title !== post.slug);

      return {
        totalViews,
        totalPosts: posts.length,
        averageViews: posts.length > 0 ? Math.round(totalViews / posts.length) : 0,
        popularPosts: enrichedPopularPosts,
        recentPosts: posts.slice(0, 10).map(post => ({
          slug: post.slug,
          title: post.frontMatter.title,
          views: 0,
          date: post.frontMatter.date,
          description: post.frontMatter.description || undefined,
          tags: post.frontMatter.tags || undefined,
          readingTime: post.readingTime || undefined,
        })),
      };
    },
  });

  logger?.info('[stats] RPC API 응답 준비 완료');

  return c.json(stats, 200, {
    'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=300',
  });
};
