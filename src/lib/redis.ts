import { createClient } from "redis"

let redisClient: ReturnType<typeof createClient> | null = null

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL })
    await redisClient.connect()
  }
  return redisClient
}

export class ViewCounter {
  private static readonly VIEW_KEY_PREFIX = 'views:'

  // 해시 키 생성
  private static getHashKey(slug: string): string {
    return `${this.VIEW_KEY_PREFIX}${slug}`
  }

  // 세션 필드명 생성
  private static getSessionField(sessionId: string): string {
    return `sessions:${sessionId}`
  }

  // 기존 문자열 키를 해시로 마이그레이션
  private static async migrateToHash(redis: ReturnType<typeof createClient>, hashKey: string): Promise<number> {
    try {
      // 기존 문자열 값 읽기
      const oldValue = await redis.get(hashKey)
      if (oldValue) {
        const views = Number(oldValue) || 0
        // 기존 키 삭제 후 해시로 생성
        await redis.del(hashKey)
        if (views > 0) {
          await redis.hSet(hashKey, 'views', views.toString())
        }
        return views
      }
      return 0
    } catch (error) {
      console.error('Failed to migrate to hash:', error)
      return 0
    }
  }

  // 세션 기반 조회수 증가 (원자적 연산으로 중복 방지)
  // 반환값: [조회수, 새로 증가시켰는지 여부]
  static async incrementWithSession(
    sessionId: string,
    slug: string
  ): Promise<[number, boolean]> {
    try {
      const redis = await getRedisClient()
      const hashKey = this.getHashKey(slug)
      const sessionField = this.getSessionField(sessionId)

      // 키 타입 확인 및 마이그레이션
      try {
        const keyType = await redis.type(hashKey)
        if (keyType === 'string') {
          // 기존 문자열 키를 해시로 마이그레이션
          await this.migrateToHash(redis, hashKey)
        } else if (keyType === 'none') {
          // 키가 없으면 새로 생성 (아무것도 안 함)
        }
        // keyType이 'hash'면 그대로 진행
      } catch (typeError) {
        // 타입 확인 실패 시 무시하고 진행
        console.warn('Failed to check key type:', typeError)
      }

      // HSETNX로 세션 필드 설정 시도 (원자적 연산)
      // 1이 반환되면 새로 설정됨 (이전에 없었음), 0이면 이미 존재함
      const isNewSession = await redis.hSetNX(hashKey, sessionField, '1')

      if (isNewSession) {
        // 새 세션이면 조회수 증가 및 TTL 설정
        // hIncrBy는 필드가 없으면 0에서 시작해서 1로 증가시킴
        const views = await redis.hIncrBy(hashKey, 'views', 1)
        console.log(`[ViewCounter.incrementWithSession] New session - slug: ${slug}, hashKey: ${hashKey}, views after increment: ${views}`)
        // TTL 설정 (없으면 24시간)
        await redis.expire(hashKey, 86400)
        return [views, true]
      } else {
        // 이미 조회한 세션이면 조회수만 조회
        console.log(`[ViewCounter.incrementWithSession] Existing session - slug: ${slug}, hashKey: ${hashKey}`)
        const views = await this.get(slug)
        return [views, false]
      }
    } catch (error) {
      console.error('Failed to increment view count with session:', error)
      return [0, false]
    }
  }

  // 조회수 증가 (세션 없이)
  static async increment(slug: string): Promise<number> {
    try {
      const redis = await getRedisClient()
      const hashKey = this.getHashKey(slug)

      // 키 타입 확인 및 마이그레이션
      try {
        const keyType = await redis.type(hashKey)
        if (keyType === 'string') {
          await this.migrateToHash(redis, hashKey)
        }
      } catch (typeError) {
        console.warn('Failed to check key type:', typeError)
      }
      
      const views = await redis.hIncrBy(hashKey, 'views', 1)
      // TTL 설정 (없으면 24시간)
      await redis.expire(hashKey, 86400)
      return views
    } catch (error) {
      console.error('Failed to increment view count:', error)
      return 0
    }
  }

  // 조회수 조회
  static async get(slug: string): Promise<number> {
    try {
      const redis = await getRedisClient()
      const hashKey = this.getHashKey(slug)

      // 키 타입 확인
      const keyType = await redis.type(hashKey)
      
      if (keyType === 'string') {
        // 기존 문자열 키면 값 읽기
        const views = await redis.get(hashKey)
        return views ? Number(views) : 0
      } else if (keyType === 'hash') {
        // 해시 타입이면 해시 필드에서 읽기
        const views = await redis.hGet(hashKey, 'views')
        return views ? Number(views) : 0
      }
      
      return 0
    } catch (error) {
      // WRONGTYPE 에러 등 발생 시 기존 방식으로 fallback
      try {
        const redis = await getRedisClient()
        const hashKey = this.getHashKey(slug)
        const views = await redis.get(hashKey)
        return views ? Number(views) : 0
      } catch {
        console.error('Failed to get view count:', error)
        return 0
      }
    }
  }

  // 여러 포스트의 조회수를 한번에 조회
  static async getMultiple(slugs: string[]): Promise<Record<string, number>> {
    try {
      const redis = await getRedisClient()
      const hashKeys = slugs.map(slug => this.getHashKey(slug))
      const pipeline = redis.multi()

      hashKeys.forEach(hashKey => {
        pipeline.hGet(hashKey, 'views')
      })

      const results = await pipeline.exec()
      const viewCounts: Record<string, number> = {}

      slugs.forEach((slug, index) => {
        const result = results?.[index]
        let views = 0

        // Redis pipeline 결과는 [error, value] 형태
        if (result && Array.isArray(result)) {
          const [error, value] = result
          if (!error && value !== null) {
            views = Number(value) || 0
          }
        }

        viewCounts[slug] = views
      })

      return viewCounts
    } catch (error) {
      console.error('Failed to get multiple view counts:', error)
      return slugs.reduce((acc, slug) => {
        acc[slug] = 0
        return acc
      }, {} as Record<string, number>)
    }
  }

  // 전체 조회수 통계
  static async getTotalViews(): Promise<number> {
    try {
      const redis = await getRedisClient()
      const keys = await redis.keys(`${this.VIEW_KEY_PREFIX}*`)
      if (keys.length === 0) return 0

      // 직접 조회 방식 (더 안정적)
      let total = 0
      for (const key of keys) {
        try {
          const views = await redis.hGet(key, 'views')
          total += views ? Number(views) : 0
        } catch (error) {
          // 개별 키 조회 실패 시 무시하고 계속
          continue
        }
      }

      return total
    } catch (error) {
      console.error('Failed to get total view count:', error)
      return 0
    }
  }

  // 인기 포스트 조회 (조회수 기준 상위 N개)
  static async getPopularPosts(limit: number = 10): Promise<Array<{ slug: string; views: number }>> {
    try {
      const redis = await getRedisClient()
      const keys = await redis.keys(`${this.VIEW_KEY_PREFIX}*`)
      if (keys.length === 0) return []

      // 직접 조회 방식 (더 안정적)
      const posts = []
      for (const key of keys) {
        try {
          const views = await redis.hGet(key, 'views')
          const viewCount = views ? Number(views) : 0

          posts.push({
            slug: key.replace(this.VIEW_KEY_PREFIX, ''),
            views: viewCount
          })
        } catch (error) {
          posts.push({
            slug: key.replace(this.VIEW_KEY_PREFIX, ''),
            views: 0
          })
        }
      }

      return posts
        .sort((a, b) => b.views - a.views)
        .slice(0, limit)
    } catch (error) {
      console.error('Failed to get popular posts:', error)
      return []
    }
  }
}