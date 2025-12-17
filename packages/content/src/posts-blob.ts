/**
 * Blob Storage에서 포스트를 가져오는 함수들
 * CDC 캐시를 통해 포스트 메타데이터를 가져오고, URL로 컨텐츠 다운로드
 */

import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { Post, PostMatter } from '@repo/types'

// BlobFile 타입 (CDC 캐시에서 가져온 파일 정보)
export interface BlobFileInfo {
  url: string
  pathname: string
  contentType: string | null
}

// 메모리 캐시
let cachedPosts: Post[] | null = null
let lastFetchTime: number = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1시간

/**
 * BlobFile 목록에서 마크다운 파일만 필터링
 */
function filterMarkdownFiles(files: BlobFileInfo[]): BlobFileInfo[] {
  return files.filter(
    (file) =>
      (file.pathname.endsWith('.md') || file.pathname.endsWith('.mdx')) &&
      !file.pathname.includes('/.') // 숨김 파일 제외
  )
}

/**
 * pathname을 slug로 변환
 * 예: "DEV/my-post/index.mdx" -> "DEV/my-post"
 * 예: "REACT/hooks.mdx" -> "REACT/hooks"
 */
function pathnameToSlug(pathname: string): string {
  let slug = pathname

  // .md, .mdx 확장자 제거
  slug = slug.replace(/\.(md|mdx)$/, '')

  // index 제거
  if (slug.endsWith('/index')) {
    slug = slug.replace(/\/index$/, '')
  }

  return slug
}

/**
 * Blob URL에서 파일 내용 다운로드
 */
async function downloadBlobContent(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download blob: ${response.statusText}`)
  }
  return response.text()
}

/**
 * BlobFile에서 단일 포스트 가져오기
 */
async function fetchPostFromBlobFile(file: BlobFileInfo): Promise<Post | null> {
  try {
    const content = await downloadBlobContent(file.url)
    const { data, content: markdownContent } = matter(content)
    const readingTimeStats = readingTime(markdownContent)
    const slug = pathnameToSlug(file.pathname)

    return {
      slug,
      frontMatter: data as PostMatter,
      content: markdownContent,
      readingTime: readingTimeStats.text,
    }
  } catch (error) {
    console.error(`Error fetching post ${file.pathname}:`, error)
    return null
  }
}

/**
 * CDC 캐시된 BlobFile 목록에서 모든 포스트 가져오기
 * @param blobFiles CDC 캐시에서 가져온 BlobFile 목록
 */
export async function fetchAllPostsFromBlobFiles(blobFiles: BlobFileInfo[]): Promise<Post[]> {
  const now = Date.now()

  // 캐시가 유효하면 캐시된 데이터 반환
  if (cachedPosts && now - lastFetchTime < CACHE_DURATION) {
    console.log('Using cached posts from memory')
    return cachedPosts
  }

  console.log('Fetching posts from CDC cached Blob files...')

  try {
    // .md 또는 .mdx 파일만 필터링
    const mdFiles = filterMarkdownFiles(blobFiles)

    console.log(`Found ${mdFiles.length} markdown files in CDC cache`)

    // 모든 파일 다운로드 및 파싱 (병렬 처리)
    const posts = await Promise.all(
      mdFiles.map((file) => fetchPostFromBlobFile(file))
    )

    // null 제거 및 정렬
    const validPosts = posts.filter((post): post is Post => post !== null)

    // 캐시 업데이트
    cachedPosts = validPosts
    lastFetchTime = now

    console.log(`Successfully fetched ${validPosts.length} posts from CDC cache`)

    return validPosts
  } catch (error) {
    console.error('Error fetching posts from Blob files:', error)

    // 에러 발생 시 캐시된 데이터라도 반환
    if (cachedPosts) {
      console.log('Returning cached posts due to error')
      return cachedPosts
    }

    return []
  }
}

/**
 * @deprecated Use fetchAllPostsFromBlobFiles() with CDC cache instead
 * Legacy function for backward compatibility
 */
export async function fetchAllPostsFromBlob(): Promise<Post[]> {
  console.warn('fetchAllPostsFromBlob() is deprecated. Use fetchAllPostsFromBlobFiles() with CDC cache.')
  return cachedPosts || []
}

/**
 * 캐시 무효화
 */
export function invalidatePostsCache(): void {
  cachedPosts = null
  lastFetchTime = 0
}
