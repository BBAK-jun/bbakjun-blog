/**
 * Blob Storage에서 포스트를 가져오는 함수들
 * CDC 캐시를 통해 포스트 메타데이터를 가져오고, 주입된 reader로 본문을 읽습니다.
 */

import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { Post, PostMatter } from '@repo/types';

export interface BlobFileInfo {
  url: string;
  pathname: string;
  contentType: string | null;
}

export type ReadPost = (pathname: string) => Promise<string>;

export type BlobFileList = BlobFileInfo[] & {
  readPost?: ReadPost;
};

function filterMarkdownFiles(files: BlobFileInfo[]): BlobFileInfo[] {
  return files.filter(
    file =>
      (file.pathname.endsWith('.md') || file.pathname.endsWith('.mdx')) &&
      !file.pathname.includes('/.')
  );
}

function pathnameToSlug(pathname: string): string {
  let slug = pathname;
  slug = slug.replace(/\.(md|mdx)$/, '');
  if (slug.endsWith('/index')) {
    slug = slug.replace(/\/index$/, '');
  }
  return slug;
}

async function downloadBlobContent(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download blob: ${response.statusText}`);
  }
  return response.text();
}

function createFetchReader(blobFiles: BlobFileInfo[]): ReadPost {
  const urlsByPathname = new Map(blobFiles.map(file => [file.pathname, file.url]));

  return async pathname => {
    const url = urlsByPathname.get(pathname);
    if (!url) {
      throw new Error(`Blob file not found: ${pathname}`);
    }
    return downloadBlobContent(url);
  };
}

async function fetchPostFromBlobFile(file: BlobFileInfo, readPost: ReadPost): Promise<Post | null> {
  try {
    const content = await readPost(file.pathname);
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

export async function fetchAllPostsFromBlobFiles(
  blobFiles: BlobFileInfo[],
  readPost: ReadPost = (blobFiles as BlobFileList).readPost ?? createFetchReader(blobFiles)
): Promise<Post[]> {
  const mdFiles = filterMarkdownFiles(blobFiles);
  const posts = await Promise.all(mdFiles.map(file => fetchPostFromBlobFile(file, readPost)));
  return posts.filter((post): post is Post => post !== null);
}
