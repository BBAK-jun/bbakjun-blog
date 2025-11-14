import { kv } from '@vercel/kv'

export class ViewCounter {
  private static readonly VIEW_KEY_PREFIX = 'views:'

  // 조회수 증가
  static async increment(slug: string): Promise<number> {
    try {
      const key = `${this.VIEW_KEY_PREFIX}${slug}`
      const views = await kv.incr(key)
      return views
    } catch (error) {
      console.error('Failed to increment view count:', error)
      return 0
    }
  }

  // 조회수 조회
  static async get(slug: string): Promise<number> {
    try {
      const key = `${this.VIEW_KEY_PREFIX}${slug}`
      const views = await kv.get<number>(key)
      return views || 0
    } catch (error) {
      console.error('Failed to get view count:', error)
      return 0
    }
  }

  // 여러 포스트의 조회수를 한번에 조회
  static async getMultiple(slugs: string[]): Promise<Record<string, number>> {
    try {
      const keys = slugs.map(slug => `${this.VIEW_KEY_PREFIX}${slug}`)
      const pipeline = kv.pipeline()

      keys.forEach(key => {
        pipeline.get(key)
      })

      const results = await pipeline.exec()
      const viewCounts: Record<string, number> = {}

      slugs.forEach((slug, index) => {
        viewCounts[slug] = (results?.[index] as number) || 0
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
      const keys = await kv.keys(`${this.VIEW_KEY_PREFIX}*`)
      if (keys.length === 0) return 0

      const pipeline = kv.pipeline()
      keys.forEach(key => {
        pipeline.get(key)
      })

      const results = await pipeline.exec()
      const total = results?.reduce((sum: number, count) => {
        return sum + ((count as number) || 0)
      }, 0) || 0

      return total
    } catch (error) {
      console.error('Failed to get total view count:', error)
      return 0
    }
  }

  // 인기 포스트 조회 (조회수 기준 상위 N개)
  static async getPopularPosts(limit: number = 10): Promise<Array<{ slug: string; views: number }>> {
    try {
      const keys = await kv.keys(`${this.VIEW_KEY_PREFIX}*`)
      if (keys.length === 0) return []

      const pipeline = kv.pipeline()
      keys.forEach(key => {
        pipeline.get(key)
      })

      const results = await pipeline.exec()
      const posts = keys
        .map((key, index) => ({
          slug: key.replace(this.VIEW_KEY_PREFIX, ''),
          views: (results?.[index] as number) || 0
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, limit)

      return posts
    } catch (error) {
      console.error('Failed to get popular posts:', error)
      return []
    }
  }
}