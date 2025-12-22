/**
 * Front matter metadata for blog posts
 */
interface PostMatter {
    title: string;
    date: string;
    description: string;
    tags?: string[];
    author?: string;
    image?: string;
    draft?: boolean;
    order?: number;
    series?: string;
    seriesOrder?: number;
}
/**
 * Complete post data including content and metadata
 */
interface Post {
    slug: string;
    frontMatter: PostMatter;
    content: string;
    readingTime: string;
}
/**
 * Partial update for post metadata (used in dashboard)
 */
interface PostUpdate {
    draft?: boolean;
    order?: number;
    title?: string;
    description?: string;
    tags?: string[];
    author?: string;
    image?: string;
}
/**
 * View count data from Redis
 */
interface ViewData {
    slug: string;
    views: number;
    incremented?: boolean;
}
/**
 * Popular post data
 */
interface PopularPost {
    slug: string;
    views: number;
}
/**
 * Series metadata
 */
interface Series {
    slug: string;
    title: string;
    description: string;
    cover?: string;
    status: 'ongoing' | 'completed';
    posts: Post[];
    totalPosts: number;
    startedAt?: string;
    updatedAt?: string;
}
/**
 * Series summary (without full post content)
 */
interface SeriesSummary {
    slug: string;
    title: string;
    description: string;
    cover?: string;
    status: 'ongoing' | 'completed';
    totalPosts: number;
    startedAt?: string;
    updatedAt?: string;
}
/**
 * Series navigation information
 */
interface SeriesNavigation {
    prev: Post | null;
    next: Post | null;
    currentIndex: number;
}

export type { PopularPost, Post, PostMatter, PostUpdate, Series, SeriesNavigation, SeriesSummary, ViewData };
