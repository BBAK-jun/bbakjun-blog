/**
 * Front matter metadata for blog posts
 */
export interface PostMatter {
  title: string
  date: string
  description: string
  tags?: string[]
  author?: string
  image?: string
  draft?: boolean
  order?: number  // For manual post ordering in dashboard
}

/**
 * Complete post data including content and metadata
 */
export interface Post {
  slug: string
  frontMatter: PostMatter
  content: string
  readingTime: string
}

/**
 * Partial update for post metadata (used in dashboard)
 */
export interface PostUpdate {
  draft?: boolean
  order?: number
  title?: string
  description?: string
  tags?: string[]
  author?: string
  image?: string
}

/**
 * View count data from Redis
 */
export interface ViewData {
  slug: string
  views: number
  incremented?: boolean
}

/**
 * Popular post data
 */
export interface PopularPost {
  slug: string
  views: number
}
