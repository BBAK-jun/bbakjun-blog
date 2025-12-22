/**
 * Blob Storage에서 포스트를 가져오는 함수들
 * CDC 캐시를 통해 포스트 메타데이터를 가져오고, URL로 컨텐츠 다운로드
 */

import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { Post, PostMatter } from '@repo/types';

// BlobFile 타입 (CDC 캐시에서 가져온 파일 정보)
export interface BlobFileInfo {
  url: string;
  pathname: string;
  contentType: string | null;
}

/**
 * BlobFile 목록에서 마크다운 파일만 필터링
 */
function filterMarkdownFiles(files: BlobFileInfo[]): BlobFileInfo[] {
  return files.filter(
    file =>
      (file.pathname.endsWith('.md') || file.pathname.endsWith('.mdx')) &&
      !file.pathname.includes('/.') // 숨김 파일 제외
  );
}

/**
 * pathname을 slug로 변환
 * 예: "DEV/my-post/index.mdx" -> "DEV/my-post"
 * 예: "REACT/hooks.mdx" -> "REACT/hooks"
 */
function pathnameToSlug(pathname: string): string {
  let slug = pathname;

  // .md, .mdx 확장자 제거
  slug = slug.replace(/\.(md|mdx)$/, '');

  // index 제거
  if (slug.endsWith('/index')) {
    slug = slug.replace(/\/index$/, '');
  }

  return slug;
}

/**
 * Blob URL에서 파일 내용 다운로드
 */
async function downloadBlobContent(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download blob: ${response.statusText}`);
  }
  return response.text();
}

/**
 * BlobFile에서 단일 포스트 가져오기
 */
async function fetchPostFromBlobFile(file: BlobFileInfo): Promise<Post | null> {
  try {
    const content = await downloadBlobContent(file.url);
    const { data, content: markdownContent } = matter(content);
    const readingTimeStats = readingTime(markdownContent);
    const slug = pathnameToSlug(file.pathname);

    return {
      slug,
      frontMatter: data as PostMatter,
      content: markdownContent,
      readingTime: readingTimeStats.text,
    };
  } catch (error) {
    console.error(`Error fetching post ${file.pathname}:`, error);
    return null;
  }
}

/**
 * CDC 캐시된 BlobFile 목록에서 모든 포스트 가져오기
 * @param blobFiles CDC 캐시에서 가져온 BlobFile 목록
 */
export async function fetchAllPostsFromBlobFiles(blobFiles: BlobFileInfo[]): Promise<Post[]> {
  // .md 또는 .mdx 파일만 필터링
  const mdFiles = filterMarkdownFiles(blobFiles);

  // 모든 파일 다운로드 및 파싱 (병렬 처리)
  const posts = await Promise.all(mdFiles.map(file => fetchPostFromBlobFile(file)));

  // null 제거
  return posts.filter((post): post is Post => post !== null);
}
