import { Series, SeriesSummary, Post } from '@repo/types';
export { Post, PostMatter, Series, SeriesSummary } from '@repo/types';
export { getAllPosts, getAllPostsIncludingDrafts, getAllTags, getPostBySlug, getPostSlugs, getPostsByTag, getRelatedPosts } from './posts.js';
export { processMarkdown } from './markdown.js';
export { rehypeMermaid } from './rehype-mermaid.js';
import 'hast';

/**
 * Get all available series with their posts
 */
declare function getAllSeries(): Promise<Series[]>;
/**
 * Get series summaries without full post content
 */
declare function getSeriesSummaries(): Promise<SeriesSummary[]>;
/**
 * Get a specific series by slug
 */
declare function getSeriesBySlug(slug: string): Promise<Series | null>;
/**
 * Get next and previous posts in a series
 */
declare function getSeriesNavigation(series: Series, currentSlug: string): {
    prev: Post | null;
    next: Post | null;
};
/**
 * Check if a post belongs to a series
 */
declare function getPostSeries(postSlug: string): Promise<Series | null>;

export { getAllSeries, getPostSeries, getSeriesBySlug, getSeriesNavigation, getSeriesSummaries };
