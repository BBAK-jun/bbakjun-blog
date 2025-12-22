import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getQdrantService } from '../../services/qdrant'
import { getEmbeddingService } from '../../services/embedding'
import { getLLMService } from '../../services/llm'
import { QueryProcessor } from '@repo/rag-core'

const mcpRoutes = new Hono()

// MCP Tool schemas
const invokeSchema = z.object({
  tool: z.string().min(1),
  arguments: z.record(z.any()),
  context: z.object({
    conversationId: z.string().optional(),
    userId: z.string().optional(),
  }).optional(),
})

const explainSchema = z.object({
  query: z.string().min(1),
  code: z.string().optional(),
  context: z.string().optional(),
})

// Available MCP tools
const MCP_TOOLS = [
  {
    name: 'search_blog',
    description: 'Search blog posts for relevant information',
    parameters: {
      query: { type: 'string', description: 'Search query' },
      category: { type: 'string', optional: true, description: 'Filter by category' },
      limit: { type: 'number', default: 5, description: 'Number of results' }
    }
  },
  {
    name: 'explain_code',
    description: 'Explain code snippets from the blog',
    parameters: {
      code: { type: 'string', description: 'Code to explain' },
      context: { type: 'string', optional: true, description: 'Additional context' }
    }
  },
  {
    name: 'find_examples',
    description: 'Find code examples for specific technologies',
    parameters: {
      technology: { type: 'string', description: 'Technology to find examples for' },
      use_case: { type: 'string', optional: true, description: 'Specific use case' }
    }
  },
  {
    name: 'get_related_posts',
    description: 'Get posts related to a specific topic',
    parameters: {
      topic: { type: 'string', description: 'Topic to find related posts for' },
      limit: { type: 'number', default: 3, description: 'Number of posts' }
    }
  }
]

// GET /mcp/tools - List available MCP tools
mcpRoutes.get('/tools', (c) => {
  return c.json({
    tools: MCP_TOOLS,
    protocol: 'mcp',
    version: '1.0.0'
  })
})

// POST /mcp/invoke - Invoke an MCP tool
mcpRoutes.post('/invoke', zValidator('json', invokeSchema), async (c) => {
  const { tool, arguments: args, context } = c.req.valid('json')

  // Verify tool exists
  const toolDef = MCP_TOOLS.find(t => t.name === tool)
  if (!toolDef) {
    return c.json({
      content: [{
        type: 'text',
        text: `Tool not found: ${tool}. Available tools: ${MCP_TOOLS.map(t => t.name).join(', ')}`
      }],
      isError: true
    }, 404)
  }

  try {
    let result: any = {}

    switch (tool) {
      case 'search_blog':
        result = await invokeSearchBlog(args)
        break
      case 'explain_code':
        result = await invokeExplainCode(args)
        break
      case 'find_examples':
        result = await invokeFindExamples(args)
        break
      case 'get_related_posts':
        result = await invokeGetRelatedPosts(args)
        break
      default:
        result = { content: 'Tool not implemented' }
    }

    return c.json({
      content: [{
        type: 'text',
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      }]
    })
  } catch (error) {
    return c.json({
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      isError: true
    }, 500)
  }
})

// POST /mcp/explain - Explain code or query
mcpRoutes.post('/explain', zValidator('json', explainSchema), async (c) => {
  const { query, code, context } = c.req.valid('json')

  // TODO: Implement explanation using RAG
  // 1. Search for relevant content
  // 2. Generate explanation with GLM-4.6
  // 3. Include sources

  return c.json({
    query,
    explanation: code
      ? `This code demonstrates ${code ? 'a specific pattern' : 'a concept'}...`
      : `Based on the blog content, ${query} refers to...`,
    sources: [
      {
        title: 'Related Post',
        slug: '/blog/related-post',
        excerpt: 'Relevant excerpt...'
      }
    ],
    relatedCode: code ? [
      {
        language: 'typescript',
        code: 'Related code example...',
        explanation: 'This shows how to implement...'
      }
    ] : undefined,
  })
})

// Tool implementation helpers
async function invokeSearchBlog(args: any) {
  try {
    const queryProcessor = new QueryProcessor(
      getQdrantService(),
      getEmbeddingService(),
      null // No LLM needed for search
    )

    const response = await queryProcessor.searchDocuments({
      query: args.query,
      limit: args.limit || 5,
      filters: args.category ? { category: args.category } : undefined,
    })

    return {
      results: response.results.map((result: any) => ({
        title: result.title,
        slug: result.slug,
        excerpt: result.content,
        relevance: result.score,
        category: result.metadata?.category,
        tags: result.metadata?.tags,
      })),
      total: response.total,
      queryTime: response.queryTime,
    }
  } catch (error) {
    console.error('Failed to search blog:', error)
    return { error: 'Search failed', message: error.message }
  }
}

async function invokeExplainCode(args: any) {
  try {
    const llmService = getLLMService()
    const queryProcessor = new QueryProcessor(
      getQdrantService(),
      getEmbeddingService(),
      llmService
    )

    // Search for relevant content first
    const searchResponse = await queryProcessor.searchDocuments({
      query: `${args.code} ${args.context || ''}`,
      limit: 3,
      threshold: 0.5,
    })

    // Generate explanation with context
    const context = searchResponse.results
      .map((r: any) => `From ${r.title}: ${r.content}`)
      .join('\n\n')

    const explanation = await llmService.chat(
      `다음 코드에 대해 설명해주세요. 관련 문서 컨텍스트를 참고하여 상세히 설명해주세요.

코드:
\`\`\`
${args.code}
\`\`\`

${context ? `관련 정보:\n${context}` : ''}

설명:`
    )

    return {
      explanation,
      concepts: extractConceptsFromExplanation(explanation),
      relatedPosts: searchResponse.results.map((r: any) => ({
        title: r.title,
        slug: r.slug,
        relevance: r.score,
      })),
    }
  } catch (error) {
    console.error('Failed to explain code:', error)
    return { error: 'Explanation failed', message: error.message }
  }
}

async function invokeFindExamples(args: any) {
  try {
    const queryProcessor = new QueryProcessor(
      getQdrantService(),
      getEmbeddingService(),
      null
    )

    const searchQuery = `${args.technology} ${args.use_case || ''} example code`
    const response = await queryProcessor.searchDocuments({
      query: searchQuery,
      limit: 5,
      threshold: 0.5,
    })

    // Extract code blocks from the content
    const examples = response.results
      .map((result: any) => {
        const codeBlocks = extractCodeBlocks(result.content)
        return {
          title: result.title,
          slug: result.slug,
          language: detectLanguage(args.technology),
          code: codeBlocks[0] || 'Code example not found',
          explanation: `Example from: ${result.title}`,
        }
      })
      .filter(ex => ex.code && ex.code !== 'Code example not found')

    return {
      examples: examples.slice(0, 3), // Return top 3 examples
      total: examples.length,
    }
  } catch (error) {
    console.error('Failed to find examples:', error)
    return { error: 'Failed to find examples', message: error.message }
  }
}

async function invokeGetRelatedPosts(args: any) {
  try {
    const queryProcessor = new QueryProcessor(
      getQdrantService(),
      getEmbeddingService(),
      null
    )

    const response = await queryProcessor.searchDocuments({
      query: args.topic,
      limit: args.limit || 3,
      threshold: 0.4,
    })

    return {
      posts: response.results.map((result: any) => ({
        title: result.title,
        slug: result.slug,
        similarity: result.score,
        excerpt: result.content,
        category: result.metadata?.category,
      })),
      total: response.total,
    }
  } catch (error) {
    console.error('Failed to get related posts:', error)
    return { error: 'Failed to get related posts', message: error.message }
  }
}

// Helper functions
function extractConceptsFromExplanation(explanation: string): string[] {
  // Simple keyword extraction - could be improved with NLP
  const concepts = explanation
    .match(/\b(TypeScript|React|Next\.js|Node\.js|JavaScript|HTML|CSS|API|Database|Authentication|Middleware|Hook|Component|State|Props|Context|Effect)\b/gi)
    || []

  return [...new Set(concepts.map(c => c.toLowerCase()))]
}

function extractCodeBlocks(content: string): string[] {
  const regex = /```[\w]*\n?([\s\S]*?)```/g
  const matches = []
  let match

  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1].trim())
  }

  return matches
}

function detectLanguage(technology: string): string {
  const tech = technology.toLowerCase()

  if (tech.includes('react') || tech.includes('jsx') || tech.includes('hook')) {
    return 'typescript'
  }
  if (tech.includes('css') || tech.includes('style')) {
    return 'css'
  }
  if (tech.includes('html')) {
    return 'html'
  }
  if (tech.includes('json') || tech.includes('api')) {
    return 'json'
  }

  return 'typescript' // Default
}

export { mcpRoutes }