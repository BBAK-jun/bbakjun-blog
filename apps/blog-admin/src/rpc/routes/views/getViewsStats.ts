import { createRoute, Context } from '@hono/zod-openapi';
import { ViewCounter } from '@repo/analytics';
import { getAllPosts } from '@repo/content';
import { getCachedBlobFiles } from '../../../lib/blob-cdc';
import {
  viewsStatsResponseSchema,
  viewsErrorSchema,
} from '../../../contract/schemas/views';
import type { AppType } from '../../../rpc';

/**
 * GET /api/v1/views/stats - 조회수 통계
 */
export const getViewsStatsRoute = createRoute({
  method: 'get',
  path: '/api/rpc/getViewsStats',
  summary: 'Get view statistics',
  description: 'Retrieve view statistics including total views, popular posts, and recent posts',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: viewsStatsResponseSchema,
        },
      },
      description: 'Successfully retrieved view statistics',
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

export const getViewsStatsHandler = async (c: Context<AppType>) => {
  try {
    console.log('[stats] RPC API 호출 시작');

    // 타임아웃 함수
    const withTimeout = <T>(
      promise: Promise<T>,
      timeoutMs: number
    ): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
            timeoutMs
          )
        ),
      ]);
    };

    // 포스트 데이터 가져오기
    const { files } = await getCachedBlobFiles({ limit: 1000, offset: 0 });
    const blobFiles = files.map((f) => ({
      url: f.url,
      pathname: f.pathname,
      contentType: f.contentType || null,
    }));
    const posts = await getAllPosts(blobFiles);
    console.log(`[stats] ${posts.length}개 포스트 로드 완료`);

    // Redis 작업들을 단계별로 실행
    let popularPosts: Array<{ slug: string; views: number }> = [];
    let totalViews = 0;

    try {
      console.log('[stats] 인기글 조회 시작');
      popularPosts = await withTimeout(ViewCounter.getPopularPosts(10), 10000);
      console.log(`[stats] 인기글 ${popularPosts.length}개 조회 완료`);
    } catch (error) {
      console.error('[stats] 인기글 조회 실패:', error);
      popularPosts = [];
    }

    try {
      console.log('[stats] 총 조회수 계산 시작');
      totalViews = await withTimeout(ViewCounter.getTotalViews(), 8000);
      console.log(`[stats] 총 조회수 ${totalViews} 계산 완료`);
    } catch (error) {
      console.error('[stats] 총 조회수 계산 실패:', error);
      totalViews = popularPosts.reduce((sum, post) => sum + post.views, 0);
    }

    // 인기글에 포스트 메타데이터 추가
    const enrichedPopularPosts = popularPosts
      .map(({ slug, views }) => {
        const post = posts.find((p) => p.slug === slug);
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
      .filter((post) => post.title !== post.slug); // 포스트 메타데이터가 없는 것들 제외

    const stats = {
      totalViews,
      totalPosts: posts.length,
      averageViews:
        posts.length > 0 ? Math.round(totalViews / posts.length) : 0,
      popularPosts: enrichedPopularPosts,
      recentPosts: posts.slice(0, 10).map((post) => ({
        slug: post.slug,
        title: post.frontMatter.title,
        views: 0, // 최신글은 조회수 0으로 설정 (성능 향상)
        date: post.frontMatter.date,
        description: post.frontMatter.description || undefined,
        tags: post.frontMatter.tags || undefined,
        readingTime: post.readingTime || undefined,
      })),
    };

    console.log('[stats] RPC API 응답 준비 완료');

    return c.json(stats, 200, {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    });
  } catch (error) {
    console.error('[stats] RPC API 에러:', error);

    // 에러 발생시 기본값 반환
    try {
      const { files } = await getCachedBlobFiles({ limit: 1000, offset: 0 });
      const blobFiles = files.map((f) => ({
        url: f.url,
        pathname: f.pathname,
        contentType: f.contentType || null,
      }));
      const posts = await getAllPosts(blobFiles);

      const fallbackStats = {
        totalViews: 0,
        totalPosts: posts.length,
        averageViews: 0,
        popularPosts: [],
        recentPosts: posts.slice(0, 10).map((post) => ({
          slug: post.slug,
          title: post.frontMatter.title,
          views: 0,
          date: post.frontMatter.date,
          description: post.frontMatter.description || undefined,
          tags: post.frontMatter.tags || undefined,
          readingTime: post.readingTime || undefined,
        })),
      };

      return c.json(fallbackStats, 200, {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      });
    } catch (fallbackError) {
      console.error('[stats] Fallback도 실패:', fallbackError);
      return c.json(
        { error: 'Failed to get stats' },
        500
      );
    }
  }
};
