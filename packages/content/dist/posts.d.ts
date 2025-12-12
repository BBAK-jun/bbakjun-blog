import { Post } from '@repo/types';

declare function getPostSlugs(): string[];
declare function getPostBySlug(slug: string): Post | null;
declare function getAllPosts(): Post[];
declare function getAllPostsIncludingDrafts(): Post[];
declare function getPostsByTag(tag: string): Post[];
declare function getAllTags(): string[];
declare function getRelatedPosts(currentPost: Post, maxPosts?: number): Post[];

export { getAllPosts, getAllPostsIncludingDrafts, getAllTags, getPostBySlug, getPostSlugs, getPostsByTag, getRelatedPosts };
