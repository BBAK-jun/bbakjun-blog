import { getRedisClient, type RedisClient } from '@repo/cache/redis';

/**
 * ViewCounter - 블로그 포스트 조회수 추적
 *
 * Redis 구조 (분리형):
 * - 조회수: views:DEV/my-post → 해시 { views: "100" } (영구 유지)
 * - 세션: sessions:DEV/my-post:user123 → "1" (24시간 TTL)
 *
 * 이 구조의 장점:
 * - 조회수는 영구적으로 유지
 * - 세션 데이터는 24시간 후 자동 삭제로 메모리 절약
 * - 중복 조회 방지는 24시간 동안 유효
 */
export class ViewCounter {
  private static readonly VIEW_KEY_PREFIX = 'views:';
  private static readonly SESSION_KEY_PREFIX = 'sessions:';
  private static readonly SESSION_TTL = 86400; // 24시간

  private static async getClient(): Promise<RedisClient> {
    return await getRedisClient();
  }

  // 조회수 키 생성 (해시)
  private static getViewKey(slug: string): string {
    return `${this.VIEW_KEY_PREFIX}${slug}`;
  }

  // 세션 키 생성 (별도 키)
  private static getSessionKey(slug: string, sessionId: string): string {
    return `${this.SESSION_KEY_PREFIX}${slug}:${sessionId}`;
  }

  // 기존 문자열 키를 해시로 마이그레이션
  private static async migrateToHash(redis: RedisClient, viewKey: string): Promise<number> {
    try {
      const oldValue = await redis.get(viewKey);
      if (oldValue) {
        const views = Number(oldValue) || 0;
        await redis.del(viewKey);
        if (views > 0) {
          await redis.hSet(viewKey, 'views', views.toString());
        }
        return views;
      }
      return 0;
    } catch (error) {
      console.error('Failed to migrate to hash:', error);
      return 0;
    }
  }

  // 기존 해시 기반 세션을 별도 키로 마이그레이션
  private static async migrateSessionToSeparateKey(
    redis: RedisClient,
    slug: string,
    sessionId: string
  ): Promise<boolean> {
    try {
      const viewKey = this.getViewKey(slug);
      const sessionField = `sessions:${sessionId}`;
      const newSessionKey = this.getSessionKey(slug, sessionId);

      // 기존 해시에서 세션 필드 확인
      const existingSession = await redis.hGet(viewKey, sessionField);

      if (existingSession) {
        // 새 세션 키 생성 및 TTL 설정
        await redis.set(newSessionKey, '1', { EX: this.SESSION_TTL });
        // 기존 해시에서 세션 필드 삭제
        await redis.hDel(viewKey, sessionField);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to migrate session to separate key:', error);
      return false;
    }
  }

  // 세션 기반 조회수 증가 (원자적 연산으로 중복 방지)
  // 반환값: [조회수, 새로 증가시켰는지 여부]
  static async incrementWithSession(sessionId: string, slug: string): Promise<[number, boolean]> {
    try {
      const redis = await this.getClient();
      const viewKey = this.getViewKey(slug);
      const sessionKey = this.getSessionKey(slug, sessionId);

      // 조회수 키 타입 확인 및 마이그레이션
      try {
        const keyType = await redis.type(viewKey);
        if (keyType === 'string') {
          await this.migrateToHash(redis, viewKey);
        }
      } catch (typeError) {
        console.warn('Failed to check view key type:', typeError);
      }

      // 세션 키 확인 (기존 해시 기반 세션이 있으면 마이그레이션)
      const sessionExists = await redis.exists(sessionKey);
      if (!sessionExists) {
        // 기존 해시 기반 세션 마이그레이션 시도
        await this.migrateSessionToSeparateKey(redis, slug, sessionId);
      }

      // SET NX 옵션으로 원자적 세션 체크 및 설정
      const isNewSession = !(await redis.exists(sessionKey));

      if (isNewSession) {
        // 새 세션 키 생성 (24시간 TTL)
        await redis.set(sessionKey, '1', { EX: this.SESSION_TTL, NX: true });

        // 조회수 증가 (영구 유지)
        const views = await redis.hIncrBy(viewKey, 'views', 1);
        console.log(
          `[ViewCounter.incrementWithSession] New session - slug: ${slug}, viewKey: ${viewKey}, sessionKey: ${sessionKey}, views after increment: ${views}`
        );
        return [views, true];
      } else {
        // 이미 조회한 세션이면 조회수만 조회
        console.log(
          `[ViewCounter.incrementWithSession] Existing session - slug: ${slug}, sessionKey: ${sessionKey}`
        );
        const views = await this.get(slug);
        return [views, false];
      }
    } catch (error) {
      console.error('Failed to increment view count with session:', error);
      return [0, false];
    }
  }

  // 조회수 증가 (세션 없이)
  static async increment(slug: string): Promise<number> {
    try {
      const redis = await this.getClient();
      const viewKey = this.getViewKey(slug);

      // 키 타입 확인 및 마이그레이션
      try {
        const keyType = await redis.type(viewKey);
        if (keyType === 'string') {
          await this.migrateToHash(redis, viewKey);
        }
      } catch (typeError) {
        console.warn('Failed to check key type:', typeError);
      }

      const views = await redis.hIncrBy(viewKey, 'views', 1);
      // 조회수는 영구 유지 (TTL 없음)
      return views;
    } catch (error) {
      console.error('Failed to increment view count:', error);
      return 0;
    }
  }

  // 조회수 조회
  static async get(slug: string): Promise<number> {
    try {
      const redis = await this.getClient();
      const viewKey = this.getViewKey(slug);

      // 키 타입 확인
      const keyType = await redis.type(viewKey);

      if (keyType === 'string') {
        // 기존 문자열 키면 값 읽기
        const views = await redis.get(viewKey);
        return views ? Number(views) : 0;
      } else if (keyType === 'hash') {
        // 해시 타입이면 해시 필드에서 읽기
        const views = await redis.hGet(viewKey, 'views');
        return views ? Number(views) : 0;
      }

      return 0;
    } catch (error) {
      console.error('Failed to get view count:', error);
      return 0;
    }
  }

  // 여러 포스트의 조회수를 한번에 조회
  static async getMultiple(slugs: string[]): Promise<Record<string, number>> {
    try {
      const redis = await this.getClient();
      const viewKeys = slugs.map(slug => this.getViewKey(slug));
      const pipeline = redis.multi();

      viewKeys.forEach(viewKey => {
        pipeline.hGet(viewKey, 'views');
      });

      const results = await pipeline.exec();
      const viewCounts: Record<string, number> = {};

      slugs.forEach((slug, index) => {
        const result = results?.[index];
        let views = 0;

        if (result && Array.isArray(result)) {
          const [error, value] = result;
          if (!error && value !== null) {
            views = Number(value) || 0;
          }
        }

        viewCounts[slug] = views;
      });

      return viewCounts;
    } catch (error) {
      console.error('Failed to get multiple view counts:', error);
      return slugs.reduce(
        (acc, slug) => {
          acc[slug] = 0;
          return acc;
        },
        {} as Record<string, number>
      );
    }
  }

  // 전체 조회수 통계
  static async getTotalViews(): Promise<number> {
    try {
      const redis = await this.getClient();
      const keys = await redis.keys(`${this.VIEW_KEY_PREFIX}*`);
      if (keys.length === 0) return 0;

      let total = 0;
      for (const key of keys) {
        try {
          const views = await redis.hGet(key, 'views');
          total += views ? Number(views) : 0;
        } catch (error) {
          continue;
        }
      }

      return total;
    } catch (error) {
      console.error('Failed to get total view count:', error);
      return 0;
    }
  }

  // 인기 포스트 조회 (조회수 기준 상위 N개)
  static async getPopularPosts(
    limit: number = 10
  ): Promise<Array<{ slug: string; views: number }>> {
    try {
      const redis = await this.getClient();
      const keys = await redis.keys(`${this.VIEW_KEY_PREFIX}*`);
      if (keys.length === 0) return [];

      const posts = [];
      for (const key of keys) {
        try {
          const views = await redis.hGet(key, 'views');
          const viewCount = views ? Number(views) : 0;

          posts.push({
            slug: key.replace(this.VIEW_KEY_PREFIX, ''),
            views: viewCount,
          });
        } catch (error) {
          posts.push({
            slug: key.replace(this.VIEW_KEY_PREFIX, ''),
            views: 0,
          });
        }
      }

      return posts.sort((a, b) => b.views - a.views).slice(0, limit);
    } catch (error) {
      console.error('Failed to get popular posts:', error);
      return [];
    }
  }
}
