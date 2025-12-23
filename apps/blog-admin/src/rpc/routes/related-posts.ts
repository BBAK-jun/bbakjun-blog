import { createRoute, z } from '@hono/zod-openapi'

const getRelatedPostsRoute = createRoute({
  method: 'post',
  path: '/api/rpc/getRelatedPosts',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            slug: z.string(),
            limit: z.number().default(5),
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Related posts',
      content: {
        'application/json': {
          schema: z.object({
            posts: z.array(z.object({
              slug: z.string(),
              title: z.string(),
              score: z.number(),
              excerpt: z.string(),
              category: z.string(),
              tags: z.array(z.string()).optional(),
            }))
          })
        }
      }
    }
  }
})

export { getRelatedPostsRoute }

export const getRelatedPostsHandler = async (c: any) => {
  const { slug, limit } = c.req.valid('json')

  try {
    // Get the current post content
    const ragUrl = process.env.NEXT_PUBLIC_RAG_URL || 'http://localhost:3002'

    // First, search for the current post to get its content
    const searchResponse = await fetch(`${ragUrl}/api/rag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: slug,
        limit: 1,
        filters: { slug },
      }),
    })

    if (!searchResponse.ok) {
      throw new Error('Failed to find current post')
    }

    const searchResult = await searchResponse.json()

    if (searchResult.results.length === 0) {
      return c.json({ posts: [] })
    }

    const currentPost = searchResult.results[0]

    // Use the content to find related posts
    const relatedResponse = await fetch(`${ragUrl}/api/rag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: currentPost.content.substring(0, 500), // Use first 500 chars
        limit: limit + 1, // +1 to exclude the current post
        threshold: 0.3,
        rerank: true,
      }),
    })

    if (!relatedResponse.ok) {
      throw new Error('Failed to find related posts')
    }

    const relatedResult = await relatedResponse.json()

    // Filter out the current post and format results
    const relatedPosts = relatedResult.results
      .filter((post: any) => post.id !== currentPost.id)
      .slice(0, limit)
      .map((post: any) => ({
        slug: post.slug,
        title: post.metadata?.title || post.slug,
        score: post.score,
        excerpt: post.content,
        category: post.metadata?.category || 'BLOG',
        tags: post.metadata?.tags || [],
      }))

    return c.json({ posts: relatedPosts })

  } catch (error) {
    console.error('Failed to get related posts:', error)

    // Fallback to basic tag-based recommendation
    try {
      // This would be the existing logic from getRelatedPosts
      // For now, return empty array
      return c.json({ posts: [] })
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      return c.json({ posts: [] })
    }
  }
}