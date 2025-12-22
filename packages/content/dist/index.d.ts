import { Series, SeriesSummary, SeriesNavigation } from '@repo/types';
export { Post, PostMatter, Series, SeriesSummary } from '@repo/types';
import { B as BlobFileInfo } from './posts-jmE_jCSv.js';
export { a as getAllPosts, b as getAllPostsIncludingDrafts, d as getAllTags, g as getPostBySlug, c as getPostsByTag, e as getRelatedPosts } from './posts-jmE_jCSv.js';
export { processMarkdown } from './markdown.js';
export { rehypeMermaid } from './rehype-mermaid.js';
import 'hast';

/**
 * Get all available series with their posts
 */
declare function getAllSeries(blobFiles: BlobFileInfo[]): Promise<Series[]>;
/**
 * Get series summaries without full post content
 */
declare function getSeriesSummaries(blobFiles: BlobFileInfo[]): Promise<SeriesSummary[]>;
/**
 * Get a specific series by slug
 */
declare function getSeriesBySlug(blobFiles: BlobFileInfo[], slug: string): Promise<Series | null>;
/**
 * Get next and previous posts in a series
 */
declare function getSeriesNavigation(series: Series, currentSlug: string): SeriesNavigation;
/**
 * Check if a post belongs to a series
 */
declare function getPostSeries(blobFiles: BlobFileInfo[], postSlug: string): Promise<Series | null>;

export { BlobFileInfo, getAllSeries, getPostSeries, getSeriesBySlug, getSeriesNavigation, getSeriesSummaries };
