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

export type { PopularPost, Post, PostMatter, PostUpdate, ViewData };
