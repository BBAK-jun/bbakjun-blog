import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

const postsDirectory = path.join(process.cwd(), 'content/posts')

export interface PostMatter {
  title: string
  date: string
  description: string
  tags?: string[]
  author?: string
  image?: string
  draft?: boolean
}

export interface Post {
  slug: string
  frontMatter: PostMatter
  content: string
  readingTime: string
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

export function getPostBySlug(slug: string): Post | null {
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

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs()
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is Post => post !== null)
    .filter((post) => !post.frontMatter.draft)
    .sort((a, b) => new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime())

  return posts
}

export function getPostsByTag(tag: string): Post[] {
  const allPosts = getAllPosts()
  return allPosts.filter((post) =>
    post.frontMatter.tags?.includes(tag)
  )
}

export function getAllTags(): string[] {
  const allPosts = getAllPosts()
  const tags = new Set<string>()

  allPosts.forEach((post) => {
    post.frontMatter.tags?.forEach((tag) => tags.add(tag))
  })

  return Array.from(tags).sort()
}

// 연관 글을 찾는 함수
export function getRelatedPosts(currentPost: Post, maxPosts: number = 4): Post[] {
  const allPosts = getAllPosts()
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