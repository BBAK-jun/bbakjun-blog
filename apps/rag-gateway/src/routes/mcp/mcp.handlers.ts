import { AppRouteHandler } from '@/libs';
import { getQdrantService } from '@/services/qdrant';
import { getEmbeddingService } from '@/services/embedding';
import { getLLMService } from '@/services/llm';
import { QueryProcessor } from '../../lib/rag/core';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import * as routes from './mcp.routes';

// Available MCP tools
const MCP_TOOLS = [
  {
    name: 'search_blog',
    description: 'Search blog posts for relevant information',
    parameters: {
      query: { type: 'string', description: 'Search query' },
      category: { type: 'string', optional: true, description: 'Filter by category' },
      limit: { type: 'number', default: 5, description: 'Number of results' },
    },
  },
  {
    name: 'explain_code',
    description: 'Explain code snippets from the blog',
    parameters: {
      code: { type: 'string', description: 'Code to explain' },
      context: { type: 'string', optional: true, description: 'Additional context' },
    },
  },
  {
    name: 'find_examples',
    description: 'Find code examples for specific technologies',
    parameters: {
      technology: { type: 'string', description: 'Technology to find examples for' },
      use_case: { type: 'string', optional: true, description: 'Specific use case' },
    },
  },
  {
    name: 'get_related_posts',
    description: 'Get posts related to a specific topic',
    parameters: {
      topic: { type: 'string', description: 'Topic to find related posts for' },
      limit: { type: 'number', default: 3, description: 'Number of posts' },
    },
  },
];

export const listTools: AppRouteHandler<typeof routes.listTools> = async c => {
  return c.json(
    {
      tools: MCP_TOOLS,
      protocol: 'mcp',
      version: '1.0.0',
    },
    HttpStatusCodes.OK
  );
};

export const invokeTool: AppRouteHandler<typeof routes.invokeTool> = async c => {
  const { tool, arguments: args } = c.req.valid('json');

  // Verify tool exists
  const toolDef = MCP_TOOLS.find(t => t.name === tool);
  if (!toolDef) {
    return c.json(
      {
        error: `Tool not found: ${tool}`,
        message: `Available tools: ${MCP_TOOLS.map(t => t.name).join(', ')}`,
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  try {
    let result: unknown = {};

    switch (tool) {
      case 'search_blog':
        result = await invokeSearchBlog(args);
        break;
      case 'explain_code':
        result = await invokeExplainCode(args);
        break;
      case 'find_examples':
        result = await invokeFindExamples(args);
        break;
      case 'get_related_posts':
        result = await invokeGetRelatedPosts(args);
        break;
      default:
        result = { content: 'Tool not implemented' };
    }

    return c.json(
      {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
          },
        ],
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    return c.json(
      {
        error: 'Tool invocation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const explain: AppRouteHandler<typeof routes.explain> = async c => {
  const { query, code } = c.req.valid('json');

  // TODO: Implement explanation using RAG
  // 1. Search for relevant content
  // 2. Generate explanation with GLM-4.6
  // 3. Include sources

  return c.json(
    {
      query,
      explanation: code
        ? `This code demonstrates ${code ? 'a specific pattern' : 'a concept'}...`
        : `Based on the blog content, ${query} refers to...`,
      sources: [
        {
          title: 'Related Post',
          slug: '/blog/related-post',
          excerpt: 'Relevant excerpt...',
        },
      ],
      relatedCode: code
        ? [
            {
              language: 'typescript',
              code: 'Related code example...',
              explanation: 'This shows how to implement...',
            },
          ]
        : undefined,
    },
    HttpStatusCodes.OK
  );
};

// Tool implementation helpers
async function invokeSearchBlog(args: unknown) {
  try {
    const argsTyped = args as { query: string; limit?: number; category?: string };
    const queryProcessor = new QueryProcessor(
      getQdrantService(),
      getEmbeddingService(),
      null // No LLM needed for search
    );

    const response = await queryProcessor.searchDocuments({
      query: argsTyped.query,
      limit: argsTyped.limit || 5,
      threshold: 0.7,
      rerank: true,
      filters: argsTyped.category ? { category: argsTyped.category } : undefined,
    });

    return {
      results: response.results.map(result => ({
        title: result.title,
        slug: result.slug,
        excerpt: result.content,
        relevance: result.score,
        category: result.metadata?.category,
        tags: result.metadata?.tags,
      })),
      total: response.total,
      queryTime: response.queryTime,
    };
  } catch (error) {
    console.error('Failed to search blog:', error);
    return {
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function invokeExplainCode(args: unknown) {
  try {
    const argsTyped = args as { code: string; context?: string };
    const llmService = getLLMService();
    const queryProcessor = new QueryProcessor(
      getQdrantService(),
      getEmbeddingService(),
      llmService
    );

    // Search for relevant content first
    const searchResponse = await queryProcessor.searchDocuments({
      query: `${argsTyped.code} ${argsTyped.context || ''}`,
      limit: 3,
      threshold: 0.5,
      rerank: true,
    });

    // Generate explanation with context
    const context = searchResponse.results
      .map(result => `From ${result.title}: ${result.content}`)
      .join('\n\n');

    const explanation = await llmService.chat(
      `다음 코드에 대해 설명해주세요. 관련 문서 컨텍스트를 참고하여 상세히 설명해주세요.

코드:
\`\`\`
${argsTyped.code}
\`\`\`

${context ? `관련 정보:\n${context}` : ''}

설명:`
    );

    return {
      explanation,
      concepts: extractConceptsFromExplanation(explanation),
      relatedPosts: searchResponse.results.map(result => ({
        title: result.title,
        slug: result.slug,
        relevance: result.score,
      })),
    };
  } catch (error) {
    console.error('Failed to explain code:', error);
    return {
      error: 'Explanation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function invokeFindExamples(args: unknown) {
  try {
    const argsTyped = args as { technology: string; use_case?: string };
    const queryProcessor = new QueryProcessor(getQdrantService(), getEmbeddingService(), null);

    const searchQuery = `${argsTyped.technology} ${argsTyped.use_case || ''} example code`;
    const response = await queryProcessor.searchDocuments({
      query: searchQuery,
      limit: 5,
      threshold: 0.5,
      rerank: true,
    });

    // Extract code blocks from the content
    const examples = response.results
      .map(result => {
        const codeBlocks = extractCodeBlocks(result.content);
        return {
          title: result.title,
          slug: result.slug,
          language: detectLanguage(argsTyped.technology),
          code: codeBlocks[0] || 'Code example not found',
          explanation: `Example from: ${result.title}`,
        };
      })
      .filter(ex => ex.code && ex.code !== 'Code example not found');

    return {
      examples: examples.slice(0, 3), // Return top 3 examples
      total: examples.length,
    };
  } catch (error) {
    console.error('Failed to find examples:', error);
    return {
      error: 'Failed to find examples',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function invokeGetRelatedPosts(args: unknown) {
  try {
    const argsTyped = args as { topic: string; limit?: number };
    const queryProcessor = new QueryProcessor(getQdrantService(), getEmbeddingService(), null);

    const response = await queryProcessor.searchDocuments({
      query: argsTyped.topic,
      limit: argsTyped.limit || 3,
      threshold: 0.4,
      rerank: true,
    });

    return {
      posts: response.results.map(result => ({
        title: result.title,
        slug: result.slug,
        similarity: result.score,
        excerpt: result.content,
        category: result.metadata?.category,
      })),
      total: response.total,
    };
  } catch (error) {
    console.error('Failed to get related posts:', error);
    return {
      error: 'Failed to get related posts',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper functions
function extractConceptsFromExplanation(explanation: string): string[] {
  // Simple keyword extraction - could be improved with NLP
  const concepts =
    explanation.match(
      /\b(TypeScript|React|Next\.js|Node\.js|JavaScript|HTML|CSS|API|Database|Authentication|Middleware|Hook|Component|State|Props|Context|Effect)\b/gi
    ) || [];

  return [...new Set(concepts.map(c => c.toLowerCase()))];
}

function extractCodeBlocks(content: string): string[] {
  const regex = /```[\w]*\n?([\s\S]*?)```/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
}

function detectLanguage(technology: string): string {
  const tech = technology.toLowerCase();

  if (tech.includes('react') || tech.includes('jsx') || tech.includes('hook')) {
    return 'typescript';
  }
  if (tech.includes('css') || tech.includes('style')) {
    return 'css';
  }
  if (tech.includes('html')) {
    return 'html';
  }
  if (tech.includes('json') || tech.includes('api')) {
    return 'json';
  }

  return 'typescript'; // Default
}
