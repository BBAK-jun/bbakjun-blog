import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { Post, PostMatter } from '@repo/types'
import { fetchAllPostsFromBlobFiles, type BlobFileInfo } from './posts-blob'

const postsDirectory = path.join(process.cwd(), '../../packages/content/posts')

// 포스트 소스 선택: 'filesystem' | 'blob'
const POST_SOURCE = process.env.POST_SOURCE || 'filesystem'

// CDC 캐시에서 가져온 BlobFile 목록을 저장할 전역 변수
let cachedBlobFiles: BlobFileInfo[] | null = null

/**
 * CDC 캐시에서 가져온 BlobFile 목록을 설정
 * Blog 앱에서 RPC로 가져온 데이터를 전달받음
 */
export function setBlobFiles(files: BlobFileInfo[]): void {
  cachedBlobFiles = files
}

function getAllMdxFiles(dir: string, relativePath: string = ''): string[] {
  if (!fs.existsSync(dir)) {
    return []
  }

  const items = fs.readdirSync(dir)
  let files: string[] = []

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // 재귀적으로 하위 폴더 탐색
      const subPath = relativePath ? `${relativePath}/${item}` : item
      files = files.concat(getAllMdxFiles(fullPath, subPath))
    } else if (item.endsWith('.mdx')) {
      // MDX 파일 추가
      const fileName = item.replace(/\.mdx$/, '')

      // index.mdx 파일의 경우 폴더명을 slug로 사용
      if (fileName === 'index' && relativePath) {
        files.push(relativePath)
      } else {
        const slug = relativePath ? `${relativePath}/${fileName}` : fileName
        files.push(slug)
      }
    }
  }

  return files
}

export function getPostSlugs(): string[] {
  return getAllMdxFiles(postsDirectory)
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  // Blob 소스 사용 시
  if (POST_SOURCE === 'blob') {
    if (!cachedBlobFiles) {
      console.error('BlobFiles not initialized. Call setBlobFiles() first.')
      return null
    }
    const allPosts = await fetchAllPostsFromBlobFiles(cachedBlobFiles)
    return allPosts.find(post => post.slug === slug) || null
  }

  // 파일시스템 소스 사용 시
  try {
    // slug에 폴더 경로가 포함될 수 있으므로 이를 처리
    // 먼저 index.mdx 파일을 확인 (대부분의 포스트가 이 패턴을 따름)
    let fullPath = path.join(postsDirectory, slug, 'index.mdx')

    // index.mdx 파일이 존재하지 않으면 직접 .mdx 파일을 확인
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(postsDirectory, `${slug}.mdx`)
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    const readingTimeStats = readingTime(content)

    return {
      slug,
      frontMatter: data as PostMatter,
      content,
      readingTime: readingTimeStats.text,
    }
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error)
    return null
  }
}

export async function getAllPosts(): Promise<Post[]> {
  // Blob 소스 사용 시
  if (POST_SOURCE === 'blob') {
    if (!cachedBlobFiles) {
      console.error('BlobFiles not initialized. Call setBlobFiles() first.')
      return []
    }
    const posts = await fetchAllPostsFromBlobFiles(cachedBlobFiles)
    return posts
      .filter((post) => !post.frontMatter.draft)
      .sort((a, b) => {
        // order가 있으면 order 우선, 없으면 날짜순
        const orderA = a.frontMatter.order ?? 999999
        const orderB = b.frontMatter.order ?? 999999

        if (orderA !== orderB) return orderA - orderB
        return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime()
      })
  }

  // 파일시스템 소스 사용 시 (기존 로직)
  const slugs = getPostSlugs()
  const postsPromises = slugs.map((slug) => getPostBySlug(slug))
  const posts = (await Promise.all(postsPromises))
    .filter((post): post is Post => post !== null)
    .filter((post) => !post.frontMatter.draft)
    .sort((a, b) => {
      // order가 있으면 order 우선, 없으면 날짜순
      const orderA = a.frontMatter.order ?? 999999
      const orderB = b.frontMatter.order ?? 999999

      if (orderA !== orderB) return orderA - orderB
      return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime()
    })

  return posts
}

// Dashboard용: draft 포함한 모든 포스트
export async function getAllPostsIncludingDrafts(): Promise<Post[]> {
  // Blob 소스 사용 시
  if (POST_SOURCE === 'blob') {
    if (!cachedBlobFiles) {
      console.error('BlobFiles not initialized. Call setBlobFiles() first.')
      return []
    }
    const posts = await fetchAllPostsFromBlobFiles(cachedBlobFiles)
    return posts.sort((a, b) => {
      const orderA = a.frontMatter.order ?? 999999
      const orderB = b.frontMatter.order ?? 999999

      if (orderA !== orderB) return orderA - orderB
      return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime()
    })
  }

  // 파일시스템 소스 사용 시
  const slugs = getPostSlugs()
  const postsPromises = slugs.map((slug) => getPostBySlug(slug))
  const posts = (await Promise.all(postsPromises))
    .filter((post): post is Post => post !== null)
    .sort((a, b) => {
      const orderA = a.frontMatter.order ?? 999999
      const orderB = b.frontMatter.order ?? 999999

      if (orderA !== orderB) return orderA - orderB
      return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime()
    })

  return posts
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const allPosts = await getAllPosts()
  return allPosts.filter((post) =>
    post.frontMatter.tags?.includes(tag)
  )
}

export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllPosts()
  const tags = new Set<string>()

  allPosts.forEach((post) => {
    post.frontMatter.tags?.forEach((tag) => tags.add(tag))
  })

  return Array.from(tags).sort()
}

// 연관 글을 찾는 함수
export async function getRelatedPosts(currentPost: Post, maxPosts: number = 4): Promise<Post[]> {
  const allPosts = await getAllPosts()
  const currentSlug = currentPost.slug
  const currentTags = currentPost.frontMatter.tags || []
  const currentCategory = currentPost.slug.split('/')[0] // 첫 번째 폴더를 카테고리로 사용

  // 현재 글 제외
  const otherPosts = allPosts.filter(post => post.slug !== currentSlug)

  // 각 글에 관련성 점수 계산
  const postsWithScores = otherPosts.map(post => {
    let score = 0
    const postTags = post.frontMatter.tags || []
    const postCategory = post.slug.split('/')[0]

    // 태그 매칭 점수 (가장 높은 가중치)
    const commonTags = postTags.filter(tag => currentTags.includes(tag))
    score += commonTags.length * 3

    // 카테고리 매칭 점수
    if (postCategory === currentCategory) {
      score += 2
    }

    // 최신성 점수 (최근 글일수록 약간의 보너스)
    const postDate = new Date(post.frontMatter.date).getTime()
    const currentDate = new Date(currentPost.frontMatter.date).getTime()
    const daysDiff = Math.abs(currentDate - postDate) / (1000 * 60 * 60 * 24)
    if (daysDiff < 30) {
      score += 0.5
    }

    return {
      post,
      score,
      commonTags: commonTags.length,
      sameCategory: postCategory === currentCategory
    }
  })

  // 점수순으로 정렬하고 상위 글들 반환
  return postsWithScores
    .sort((a, b) => {
      // 점수가 같으면 공통 태그 수로, 그것도 같으면 날짜로 정렬
      if (b.score === a.score) {
        if (b.commonTags === a.commonTags) {
          return new Date(b.post.frontMatter.date).getTime() - new Date(a.post.frontMatter.date).getTime()
        }
        return b.commonTags - a.commonTags
      }
      return b.score - a.score
    })
    .slice(0, maxPosts)
    .map(item => item.post)
}
