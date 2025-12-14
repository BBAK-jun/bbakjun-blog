/**
 * Blob Storage에서 포스트를 가져오는 함수들
 * 빌드 타임에 Vercel Blob에서 모든 포스트를 다운로드
 */

import { list } from '@vercel/blob'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { Post, PostMatter } from '@repo/types'

// 메모리 캐시
let cachedPosts: Post[] | null = null
let lastFetchTime: number = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1시간

/**
 * Blob Storage에서 모든 마크다운 파일 목록 가져오기
 */
async function listBlobPosts(): Promise<string[]> {
  try {
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // .md 또는 .mdx 파일만 필터링
    const mdFiles = blobs
      .filter(
        (blob) =>
          (blob.pathname.endsWith('.md') || blob.pathname.endsWith('.mdx')) &&
          !blob.pathname.includes('/.') // 숨김 파일 제외
      )
      .map((blob) => blob.pathname)

    return mdFiles
  } catch (error) {
    console.error('Error listing blob posts:', error)
    return []
  }
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
 * Blob Storage에서 단일 포스트 가져오기
 */
async function fetchPostFromBlob(pathname: string, url: string): Promise<Post | null> {
  try {
    const content = await downloadBlobContent(url)
    const { data, content: markdownContent } = matter(content)
    const readingTimeStats = readingTime(markdownContent)
    const slug = pathnameToSlug(pathname)

    return {
      slug,
      frontMatter: data as PostMatter,
      content: markdownContent,
      readingTime: readingTimeStats.text,
    }
  } catch (error) {
    console.error(`Error fetching post ${pathname}:`, error)
    return null
  }
}

/**
 * Blob Storage에서 모든 포스트 가져오기 (캐시 포함)
 */
export async function fetchAllPostsFromBlob(): Promise<Post[]> {
  const now = Date.now()

  // 캐시가 유효하면 캐시된 데이터 반환
  if (cachedPosts && now - lastFetchTime < CACHE_DURATION) {
    console.log('Using cached posts from Blob')
    return cachedPosts
  }

  console.log('Fetching posts from Blob Storage...')

  try {
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // .md 또는 .mdx 파일만 필터링
    const mdBlobs = blobs.filter(
      (blob) =>
        (blob.pathname.endsWith('.md') || blob.pathname.endsWith('.mdx')) &&
        !blob.pathname.includes('/.') // 숨김 파일 제외
    )

    console.log(`Found ${mdBlobs.length} markdown files in Blob Storage`)

    // 모든 파일 다운로드 및 파싱 (병렬 처리)
    const posts = await Promise.all(
      mdBlobs.map((blob) => fetchPostFromBlob(blob.pathname, blob.url))
    )

    // null 제거 및 정렬
    const validPosts = posts.filter((post): post is Post => post !== null)

    // 캐시 업데이트
    cachedPosts = validPosts
    lastFetchTime = now

    console.log(`Successfully fetched ${validPosts.length} posts from Blob`)

    return validPosts
  } catch (error) {
    console.error('Error fetching posts from Blob:', error)

    // 에러 발생 시 캐시된 데이터라도 반환
    if (cachedPosts) {
      console.log('Returning cached posts due to error')
      return cachedPosts
    }

    return []
  }
}

/**
 * 캐시 무효화
 */
export function invalidatePostsCache(): void {
  cachedPosts = null
  lastFetchTime = 0
}
