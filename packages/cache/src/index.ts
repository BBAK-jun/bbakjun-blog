/**
 * API 응답 캐싱 유틸리티
 *
 * Cloudflare Workers KV(운영) 또는 Redis(로컬·Vercel)로 DB 쿼리 결과를 캐싱합니다.
 * KV 바인딩이 등록되어 있으면 KV만 사용하고, 없으면 기존 Redis 경로로 내려갑니다.
 * (workerd에서 node-redis가 매달리던 문제 때문에 2026-11-18 KV로 이전)
 */

import {
  chunk,
  getKvBinding,
  isKvAvailable,
  listAllKvKeys,
  setKvBindingResolver,
  type KvBinding,
} from './kv';
import { closeRedisClient, getRedisClient, isRedisAvailable, withTimeout } from './redis';

/** Redis 명령 상한 시간 (workerd에서 소켓이 매달리는 경우 방어) */
const REDIS_COMMAND_TIMEOUT_MS = 2_000;

/** KV 만료 시간 최소값 (Cloudflare KV 제약: 60초 이상) */
const KV_MIN_EXPIRATION_TTL = 60;

// Export Redis client functions for use in other packages (e.g., rate limiting)
export type { RedisClient } from './redis';
export {
  closeRedisClient,
  getKvBinding,
  getRedisClient,
  isKvAvailable,
  isRedisAvailable,
  listAllKvKeys,
  setKvBindingResolver,
  withTimeout,
};
export type { KvBinding } from './kv';

/**
 * 캐싱 옵션
 */
export interface CacheOptions<T> {
  /** 캐시 키 (필수) */
  key: string;
  /** DB 쿼리 또는 비용이 큰 연산 (필수) */
  query: () => Promise<T>;
  /** 캐시 만료 시간 (초 단위, 기본값: 300초 = 5분) */
  ttl?: number;
  /** Redis 실패 시 fallback 여부 (기본값: true) */
  fallback?: boolean;
  /** 캐시 적중 여부 로깅 (기본값: false) */
  debug?: boolean;
}

/**
 * 캐시 결과 (디버깅용)
 */
export interface CachedResult<T> {
  /** 쿼리 결과 데이터 */
  data: T;
  /** 캐시에서 가져왔는지 여부 */
  fromCache: boolean;
}

/**
 * Redis 캐싱 데코레이터
 *
 * @example
 * ```typescript
 * const result = await cachedQuery({
 *   key: 'blob-files:100:0:posts',
 *   query: () => prisma.blobFile.findMany({ take: 100 }),
 *   ttl: 300,
 * });
 * ```
 */
export async function cachedQuery<T>(options: CacheOptions<T>): Promise<CachedResult<T>> {
  const { key, query, ttl = 300, fallback = true, debug = false } = options;

  // 1순위: Cloudflare Workers KV 바인딩
  const kv = await getKvBinding();
  if (kv) {
    return cachedQueryKv(kv, key, query, ttl, fallback, debug);
  }

  // 2순위: Redis (로컬 개발 · Vercel)
  try {
    // Redis 사용 가능 여부 확인
    const redisAvailable = await isRedisAvailable();

    if (!redisAvailable) {
      if (debug) console.log(`[Cache] Redis unavailable, executing query directly: ${key}`);
      const data = await query();
      return { data, fromCache: false };
    }

    const redis = await getRedisClient();

    // 1. 캐시 확인
    // Redis 명령도 매달릴 수 있으므로 상한 시간을 건다(넘으면 catch → DB 직접 쿼리)
    const cached = await withTimeout(redis.get(key), REDIS_COMMAND_TIMEOUT_MS, 'Redis GET');

    if (cached) {
      if (debug) console.log(`[Cache] HIT: ${key}`);
      return {
        data: JSON.parse(cached) as T,
        fromCache: true,
      };
    }

    if (debug) console.log(`[Cache] MISS: ${key}`);

    // 2. DB 쿼리 실행
    const data = await query();

    // 3. 캐시 저장
    try {
      await withTimeout(
        redis.set(key, JSON.stringify(data), { EX: ttl }),
        REDIS_COMMAND_TIMEOUT_MS,
        'Redis SET'
      );
      if (debug) console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
    } catch (setError) {
      // 캐시 저장 실패는 쿼리 결과 반환에 영향을 주지 않음
      console.warn(`[Cache] Failed to set cache for ${key}:`, setError);
    }

    return { data, fromCache: false };
  } catch (error) {
    // Redis 오류 발생 시 fallback
    if (fallback) {
      console.warn(`[Cache] Redis error, falling back to direct query: ${key}`, error);
      const data = await query();
      return { data, fromCache: false };
    }
    throw error;
  }
}

/**
 * KV 백엔드용 cachedQuery
 *
 * KV는 리전 간 eventual consistency(최대 60초)가 있으므로 캐시 값이 잠깐 낡을 수 있다.
 * 조회 실패는 DB 직접 쿼리로 폴백한다.
 */
async function cachedQueryKv<T>(
  kv: KvBinding,
  key: string,
  query: () => Promise<T>,
  ttl: number,
  fallback: boolean,
  debug: boolean
): Promise<CachedResult<T>> {
  try {
    const cached = await kv.get(key);

    if (cached) {
      if (debug) console.log(`[Cache] KV HIT: ${key}`);
      return { data: JSON.parse(cached) as T, fromCache: true };
    }

    if (debug) console.log(`[Cache] KV MISS: ${key}`);

    const data = await query();

    try {
      await kv.put(key, JSON.stringify(data), {
        expirationTtl: Math.max(KV_MIN_EXPIRATION_TTL, ttl),
      });
      if (debug) console.log(`[Cache] KV SET: ${key} (TTL: ${ttl}s)`);
    } catch (setError) {
      // 캐시 저장 실패는 쿼리 결과 반환에 영향을 주지 않음
      console.warn(`[Cache] Failed to write KV cache for ${key}:`, setError);
    }

    return { data, fromCache: false };
  } catch (error) {
    if (fallback) {
      console.warn(`[Cache] KV error, falling back to direct query: ${key}`, error);
      const data = await query();
      return { data, fromCache: false };
    }
    throw error;
  }
}

/**
 * 캐시 무효화 (패턴 매칭)
 *
 * @example
 * ```typescript
 * // blob-files 관련 모든 캐시 삭제
 * await invalidateCache('blob-files:*');
 *
 * // 특정 키만 삭제
 * await invalidateCache('views:stats');
 * ```
 */
export async function invalidateCache(pattern: string): Promise<number> {
  // 1순위: Cloudflare Workers KV (list + delete)
  const kv = await getKvBinding();
  if (kv) {
    try {
      const keys = pattern.includes('*')
        ? await listAllKvKeys(kv, pattern.slice(0, pattern.indexOf('*')))
        : [pattern];

      if (keys.length === 0) {
        console.log(`[Cache] KV: no keys matching ${pattern}`);
        return 0;
      }

      for (const batch of chunk(keys, 50)) {
        await Promise.all(batch.map(name => kv.delete(name)));
      }

      console.log(`[Cache] KV: deleted ${keys.length} keys matching: ${pattern}`);
      return keys.length;
    } catch (error) {
      console.error(`[Cache] KV: failed to invalidate ${pattern}`, error);
      return 0;
    }
  }

  // 2순위: Redis
  try {
    const redisAvailable = await isRedisAvailable();
    if (!redisAvailable) {
      console.log(`[Cache] Redis unavailable, skipping invalidation: ${pattern}`);
      return 0;
    }

    const redis = await getRedisClient();

    // 와일드카드가 없으면 직접 삭제
    if (!pattern.includes('*')) {
      const result = await withTimeout(redis.del(pattern), REDIS_COMMAND_TIMEOUT_MS, 'Redis DEL');
      console.log(`[Cache] Deleted key: ${pattern}`);
      return result;
    }

    // 와일드카드가 있으면 SCAN으로 키 찾기
    let cursor = '0';
    let deletedCount = 0;

    do {
      const scanResult = await withTimeout(
        redis.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        }),
        REDIS_COMMAND_TIMEOUT_MS,
        'Redis SCAN'
      );

      cursor = scanResult.cursor;
      const keys = scanResult.keys;

      if (keys.length > 0) {
        const deleted = await withTimeout(
          redis.del(keys),
          REDIS_COMMAND_TIMEOUT_MS,
          'Redis DEL'
        );
        deletedCount += deleted;
      }
    } while (cursor !== '0');

    console.log(`[Cache] Deleted ${deletedCount} keys matching: ${pattern}`);
    return deletedCount;
  } catch (error) {
    console.error(`[Cache] Failed to invalidate cache: ${pattern}`, error);
    return 0;
  }
}

/**
 * 캐시 키 생성 헬퍼
 */
export class CacheKeyBuilder {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  /**
   * 쿼리 파라미터에서 캐시 키 생성
   */
  build(params: Record<string, string | number | boolean | undefined>): string {
    const parts = Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}:${value}`);

    return parts.length > 0 ? `${this.prefix}:${parts.join(':')}` : this.prefix;
  }

  /**
   * 와일드카드 패턴 생성 (무효화용)
   */
  pattern(): string {
    return `${this.prefix}:*`;
  }
}

/**
 * 미리 정의된 캐시 키 빌더
 */
export const CacheKeys = {
  blobFiles: (params: { limit?: number; offset?: number; search?: string } = {}) =>
    new CacheKeyBuilder('blob-files').build(params),

  blobFilesPattern: () => new CacheKeyBuilder('blob-files').pattern(),

  // 주의: 조회수 원본(`views:{slug}`)과 같은 네임스페이스를 쓰면
  // getTotalViews/getPopularPosts 의 prefix 순회에 캐시 키가 섞인다.
  viewsStats: () => 'cache:views:stats',

  viewsPopularPosts: (limit: number) => `cache:views:popular:${limit}`,

  viewsTotal: () => 'cache:views:total',
};

/**
 * 캐시 래퍼 클래스 (메서드 체이닝용)
 */
export class CacheWrapper<T> {
  private options: Partial<CacheOptions<T>> = {};

  constructor(private key: string) {}

  /**
   * 만료 시간 설정
   */
  expire(ttl: number): this {
    this.options.ttl = ttl;
    return this;
  }

  /**
   * 디버그 모드 활성화
   */
  debug(): this {
    this.options.debug = true;
    return this;
  }

  /**
   * 쿼리 실행 및 캐싱
   */
  async query(queryFn: () => Promise<T>): Promise<CachedResult<T>> {
    return cachedQuery({
      key: this.key,
      query: queryFn,
      ...this.options,
    });
  }
}

/**
 * 캐시 래퍼 생성 (체이닝용)
 *
 * @example
 * ```typescript
 * const result = await cache('my-key').expire(600).debug().query(() => fetchData());
 * ```
 */
export function cache<T>(key: string): CacheWrapper<T> {
  return new CacheWrapper<T>(key);
}
