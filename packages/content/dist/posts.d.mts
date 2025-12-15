import { Post } from '@repo/types';

declare function getPostSlugs(): string[];
declare function getPostBySlug(slug: string): Promise<Post | null>;
declare function getAllPosts(): Promise<Post[]>;
declare function getAllPostsIncludingDrafts(): Promise<Post[]>;
declare function getPostsByTag(tag: string): Promise<Post[]>;
declare function getAllTags(): Promise<string[]>;
declare function getRelatedPosts(currentPost: Post, maxPosts?: number): Promise<Post[]>;

export { getAllPosts, getAllPostsIncludingDrafts, getAllTags, getPostBySlug, getPostSlugs, getPostsByTag, getRelatedPosts };
