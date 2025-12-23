import { searchBlogPosts } from '@/lib/rag'

interface Post {
  slug: string
  frontMatter: {
    title: string
    date: string
    tags?: string[]
  }
  content?: string
}

export async function getRelatedPostsWithRAG(
  currentPost: Post,
  limit: number = 4
): Promise<Post[]> {
  // RAG를 사용하여 관련 포스트 검색
  try {
    // 현재 포스트의 내용과 제목을 쿼리로 사용
    const queryText = `${currentPost.frontMatter.title}. ${currentPost.content?.slice(0, 500) || ''}`

    const searchResult = await searchBlogPosts({
      query: queryText,
      limit: limit + 2, // 현재 포스트가 포함될 수 있으므로 더 많이 가져옴
      threshold: 0.5, // 낮은 임계값으로 더 많은 관련 포스트 포함
    })

    // 결과에서 현재 포스트 제외
    const relatedPosts = searchResult.results
      .filter(result => {
        // slug로 현재 포스트와 다른지 확인
        return result.slug !== `/blog/${currentPost.slug}` &&
               result.slug !== currentPost.slug
      })
      .map(result => ({
        slug: result.slug.replace('/blog/', ''), // /blog/ 접두사 제거
        frontMatter: {
          title: result.title,
          date: result.metadata?.publishedAt || new Date().toISOString(),
          tags: result.metadata?.tags || [],
        },
      }))
      .slice(0, limit)

    return relatedPosts
  } catch (error) {
    console.error('Failed to get related posts with RAG:', error)
    return [] // RAG 실패시 빈 배열 반환
  }
}

// 기존의 태그 기반 관련 포스트와 결합
export async function getHybridRelatedPosts(
  currentPost: Post,
  limit: number = 4,
  ragWeight: number = 0.7 // RAG 결과의 가중치
): Promise<Post[]> {
  // 1. 기존 방식으로 관련 포스트 가져오기
  const { getRelatedPosts } = require('./posts')
  const { getBlobFiles } = require('@/lib/blob')

  let tagBasedPosts: Post[] = []
  try {
    const blobFiles = await getBlobFiles()
    tagBasedPosts = await getRelatedPosts(blobFiles, currentPost, limit * 2)
  } catch (error) {
    console.error('Failed to get tag-based related posts:', error)
  }

  // 2. RAG로 관련 포스트 가져오기
  let ragBasedPosts: Post[] = []
  try {
    ragBasedPosts = await getRelatedPostsWithRAG(currentPost, limit * 2)
  } catch (error) {
    console.error('Failed to get RAG related posts:', error)
  }

  // 3. 두 결과 결합
  const combinedMap = new Map<string, { post: Post; score: number }>()

  // RAG 기반 결과 추가 (더 높은 가중치)
  ragBasedPosts.forEach((post, index) => {
    const score = (limit - index) * ragWeight
    combinedMap.set(post.slug, { post, score })
  })

  // 태그 기반 결과 추가 (더 낮은 가중치)
  tagBasedPosts.forEach((post, index) => {
    const existing = combinedMap.get(post.slug)
    const score = (limit - index) * (1 - ragWeight)

    if (existing) {
      // 이미 있다면 점수 합산
      existing.score += score
    } else {
      combinedMap.set(post.slug, { post, score })
    }
  })

  // 4. 점수순으로 정렬하고 상위 결과 반환
  return Array.from(combinedMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post)
}

// RAG 사용 가능 여부 확인
export function isRAGAvailable(): boolean {
  return !!process.env.NEXT_PUBLIC_RAG_URL
}