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

declare function getPostBySlug(blobFiles: BlobFileInfo[], slug: string): Promise<Post | null>;
declare function getAllPosts(blobFiles: BlobFileInfo[]): Promise<Post[]>;
declare function getAllPostsIncludingDrafts(blobFiles: BlobFileInfo[]): Promise<Post[]>;
declare function getPostsByTag(blobFiles: BlobFileInfo[], tag: string): Promise<Post[]>;
declare function getAllTags(blobFiles: BlobFileInfo[]): Promise<string[]>;
declare function getRelatedPosts(blobFiles: BlobFileInfo[], currentPost: Post, maxPosts?: number): Promise<Post[]>;

export { type BlobFileInfo as B, getAllPosts as a, getAllPostsIncludingDrafts as b, getPostsByTag as c, getAllTags as d, getRelatedPosts as e, getPostBySlug as g };
