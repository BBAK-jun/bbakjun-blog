// Re-export types
export type { Post, PostMatter, Series, SeriesSummary } from '@repo/types';
export type { BlobFileInfo } from './posts-blob';

// Re-export everything from posts
export {
  getPostBySlug,
  getAllPosts,
  getAllPostsIncludingDrafts,
  getPostsByTag,
  getAllTags,
  getRelatedPosts,
} from './posts';

// Re-export series functions
export {
  getAllSeries,
  getSeriesSummaries,
  getSeriesBySlug,
  getSeriesNavigation,
  getPostSeries,
} from './series';

// Re-export markdown processing
export { processMarkdown } from './markdown';

// Re-export rehype plugin
export { rehypeMermaid } from './rehype-mermaid';
