// src/index.ts
import { createClient } from "redis";
var redisClient = null;
async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
  }
  return redisClient;
}
var ViewCounter = class {
  // 해시 키 생성
  static getHashKey(slug) {
    return `${this.VIEW_KEY_PREFIX}${slug}`;
  }
  // 세션 필드명 생성
  static getSessionField(sessionId) {
    return `sessions:${sessionId}`;
  }
  // 기존 문자열 키를 해시로 마이그레이션
  static async migrateToHash(redis, hashKey) {
    try {
      const oldValue = await redis.get(hashKey);
      if (oldValue) {
        const views = Number(oldValue) || 0;
        await redis.del(hashKey);
        if (views > 0) {
          await redis.hSet(hashKey, "views", views.toString());
        }
        return views;
      }
      return 0;
    } catch (error) {
      console.error("Failed to migrate to hash:", error);
      return 0;
    }
  }
  // 세션 기반 조회수 증가 (원자적 연산으로 중복 방지)
  // 반환값: [조회수, 새로 증가시켰는지 여부]
  static async incrementWithSession(sessionId, slug) {
    try {
      const redis = await getRedisClient();
      const hashKey = this.getHashKey(slug);
      const sessionField = this.getSessionField(sessionId);
      try {
        const keyType = await redis.type(hashKey);
        if (keyType === "string") {
          await this.migrateToHash(redis, hashKey);
        } else if (keyType === "none") {
        }
      } catch (typeError) {
        console.warn("Failed to check key type:", typeError);
      }
      const isNewSession = await redis.hSetNX(hashKey, sessionField, "1");
      if (isNewSession) {
        const views = await redis.hIncrBy(hashKey, "views", 1);
        console.log(`[ViewCounter.incrementWithSession] New session - slug: ${slug}, hashKey: ${hashKey}, views after increment: ${views}`);
        await redis.expire(hashKey, 86400);
        return [views, true];
      } else {
        console.log(`[ViewCounter.incrementWithSession] Existing session - slug: ${slug}, hashKey: ${hashKey}`);
        const views = await this.get(slug);
        return [views, false];
      }
    } catch (error) {
      console.error("Failed to increment view count with session:", error);
      return [0, false];
    }
  }
  // 조회수 증가 (세션 없이)
  static async increment(slug) {
    try {
      const redis = await getRedisClient();
      const hashKey = this.getHashKey(slug);
      try {
        const keyType = await redis.type(hashKey);
        if (keyType === "string") {
          await this.migrateToHash(redis, hashKey);
        }
      } catch (typeError) {
        console.warn("Failed to check key type:", typeError);
      }
      const views = await redis.hIncrBy(hashKey, "views", 1);
      await redis.expire(hashKey, 86400);
      return views;
    } catch (error) {
      console.error("Failed to increment view count:", error);
      return 0;
    }
  }
  // 조회수 조회
  static async get(slug) {
    try {
      const redis = await getRedisClient();
      const hashKey = this.getHashKey(slug);
      const keyType = await redis.type(hashKey);
      if (keyType === "string") {
        const views = await redis.get(hashKey);
        return views ? Number(views) : 0;
      } else if (keyType === "hash") {
        const views = await redis.hGet(hashKey, "views");
        return views ? Number(views) : 0;
      }
      return 0;
    } catch (error) {
      try {
        const redis = await getRedisClient();
        const hashKey = this.getHashKey(slug);
        const views = await redis.get(hashKey);
        return views ? Number(views) : 0;
      } catch {
        console.error("Failed to get view count:", error);
        return 0;
      }
    }
  }
  // 여러 포스트의 조회수를 한번에 조회
  static async getMultiple(slugs) {
    try {
      const redis = await getRedisClient();
      const hashKeys = slugs.map((slug) => this.getHashKey(slug));
      const pipeline = redis.multi();
      hashKeys.forEach((hashKey) => {
        pipeline.hGet(hashKey, "views");
      });
      const results = await pipeline.exec();
      const viewCounts = {};
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
      console.error("Failed to get multiple view counts:", error);
      return slugs.reduce((acc, slug) => {
        acc[slug] = 0;
        return acc;
      }, {});
    }
  }
  // 전체 조회수 통계
  static async getTotalViews() {
    try {
      const redis = await getRedisClient();
      const keys = await redis.keys(`${this.VIEW_KEY_PREFIX}*`);
      if (keys.length === 0) return 0;
      let total = 0;
      for (const key of keys) {
        try {
          const views = await redis.hGet(key, "views");
          total += views ? Number(views) : 0;
        } catch (error) {
          continue;
        }
      }
      return total;
    } catch (error) {
      console.error("Failed to get total view count:", error);
      return 0;
    }
  }
  // 인기 포스트 조회 (조회수 기준 상위 N개)
  static async getPopularPosts(limit = 10) {
    try {
      const redis = await getRedisClient();
      const keys = await redis.keys(`${this.VIEW_KEY_PREFIX}*`);
      if (keys.length === 0) return [];
      const posts = [];
      for (const key of keys) {
        try {
          const views = await redis.hGet(key, "views");
          const viewCount = views ? Number(views) : 0;
          posts.push({
            slug: key.replace(this.VIEW_KEY_PREFIX, ""),
            views: viewCount
          });
        } catch (error) {
          posts.push({
            slug: key.replace(this.VIEW_KEY_PREFIX, ""),
            views: 0
          });
        }
      }
      return posts.sort((a, b) => b.views - a.views).slice(0, limit);
    } catch (error) {
      console.error("Failed to get popular posts:", error);
      return [];
    }
  }
};
ViewCounter.VIEW_KEY_PREFIX = "views:";
export {
  ViewCounter
};
