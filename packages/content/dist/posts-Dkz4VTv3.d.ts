import { Post } from '@repo/types';

/**
 * Blob Storage에서 포스트를 가져오는 함수들
 * CDC 캐시를 통해 포스트 메타데이터를 가져오고, URL로 컨텐츠 다운로드
 */

interface BlobFileInfo {
    url: string;
    pathname: string;
    contentType: string | null;
}

/**
 * CDC 캐시에서 가져온 BlobFile 목록을 설정
 * Blog 앱에서 RPC로 가져온 데이터를 전달받음
 */
declare function setBlobFiles(files: BlobFileInfo[]): void;
declare function getPostSlugs(): string[];
declare function getPostBySlug(slug: string): Promise<Post | null>;
declare function getAllPosts(): Promise<Post[]>;
declare function getAllPostsIncludingDrafts(): Promise<Post[]>;
declare function getPostsByTag(tag: string): Promise<Post[]>;
declare function getAllTags(): Promise<string[]>;
declare function getRelatedPosts(currentPost: Post, maxPosts?: number): Promise<Post[]>;

export { type BlobFileInfo as B, getPostBySlug as a, getAllPosts as b, getAllPostsIncludingDrafts as c, getPostsByTag as d, getAllTags as e, getRelatedPosts as f, getPostSlugs as g, setBlobFiles as s };
