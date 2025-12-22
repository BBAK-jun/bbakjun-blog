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
  series?: string  // Series slug this post belongs to
  seriesOrder?: number  // Order within the series
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

/**
 * Series metadata
 */
export interface Series {
  slug: string
  title: string
  description: string
  cover?: string  // Cover image URL
  status: 'ongoing' | 'completed'
  posts: Post[]  // Posts in this series, ordered by seriesOrder
  totalPosts: number
  startedAt?: string  // Date of first post
  updatedAt?: string  // Date of last post
}

/**
 * Series summary (without full post content)
 */
export interface SeriesSummary {
  slug: string
  title: string
  description: string
  cover?: string
  status: 'ongoing' | 'completed'
  totalPosts: number
  startedAt?: string
  updatedAt?: string
}

/**
 * Series navigation information
 */
export interface SeriesNavigation {
  prev: Post | null
  next: Post | null
  currentIndex: number
}
