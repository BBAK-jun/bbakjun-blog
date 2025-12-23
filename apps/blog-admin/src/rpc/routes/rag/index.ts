import { createRoute, z } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';

const app = new OpenAPIHono();

// Query blog content with RAG
const queryBlogContentRoute = createRoute({
  method: 'post',
  path: '/api/rpc/queryBlogContent',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            query: z.string(),
            context: z.string().optional(),
            limit: z.number().default(5),
            filters: z
              .object({
                category: z.string().optional(),
                tags: z.array(z.string()).optional(),
              })
              .optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successful RAG query response',
      content: {
        'application/json': {
          schema: z.object({
            answer: z.string(),
            sources: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                slug: z.string(),
                content: z.string(),
                score: z.number(),
                metadata: z.record(z.string(), z.unknown()).optional(),
              })
            ),
            usage: z
              .object({
                model: z.string(),
                totalTokens: z.number(),
                promptTokens: z.number(),
                completionTokens: z.number(),
                cost: z.number().optional(),
              })
              .optional(),
          }),
        },
      },
    },
    500: {
      description: 'Error response',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
});

// Search blog posts
const searchBlogPostsRoute = createRoute({
  method: 'post',
  path: '/api/rpc/searchBlogPosts',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            query: z.string(),
            limit: z.number().default(10),
            threshold: z.number().default(0.7),
            filters: z
              .object({
                category: z.string().optional(),
                tags: z.array(z.string()).optional(),
              })
              .optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successful search response',
      content: {
        'application/json': {
          schema: z.object({
            results: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                slug: z.string(),
                content: z.string(),
                score: z.number(),
                metadata: z.record(z.string(), z.unknown()).optional(),
              })
            ),
            total: z.number(),
            queryTime: z.number(),
          }),
        },
      },
    },
  },
});

// Trigger document ingestion
const ingestDocumentsRoute = createRoute({
  method: 'post',
  path: '/api/rpc/ingestDocuments',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            force: z.boolean().default(false),
            batchSize: z.number().default(10),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Ingestion started successfully',
      content: {
        'application/json': {
          schema: z.object({
            jobId: z.string(),
            status: z.string(),
            message: z.string(),
          }),
        },
      },
    },
  },
});

// Get ingestion status
const getIngestionStatusRoute = createRoute({
  method: 'get',
  path: '/api/rpc/getIngestionStatus',
  request: {
    query: z.object({
      jobId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Ingestion status',
      content: {
        'application/json': {
          schema: z.object({
            jobId: z.string(),
            status: z.enum(['running', 'completed', 'failed']),
            progress: z.object({
              total: z.number(),
              processed: z.number(),
              failed: z.number(),
              percentage: z.number(),
            }),
            startedAt: z.string(),
            completedAt: z.string().optional(),
            error: z.string().optional(),
          }),
        },
      },
    },
  },
});

// Get RAG statistics
const getRAGStatsRoute = createRoute({
  method: 'get',
  path: '/api/rpc/getRAGStats',
  responses: {
    200: {
      description: 'RAG statistics',
      content: {
        'application/json': {
          schema: z.object({
            documents: z.object({
              total: z.number(),
              indexed: z.number(),
              categories: z.record(z.string(), z.number()),
            }),
            usage: z.object({
              totalQueries: z.number(),
              avgQueryTime: z.number(),
            }),
            system: z.object({
              status: z.string(),
              uptime: z.string(),
            }),
          }),
        },
      },
    },
  },
});

// Export routes
export const ragRoutes = {
  queryBlogContent: queryBlogContentRoute,
  searchBlogPosts: searchBlogPostsRoute,
  ingestDocuments: ingestDocumentsRoute,
  getIngestionStatus: getIngestionStatusRoute,
  getRAGStats: getRAGStatsRoute,
};

// Export handlers
export const ragHandlers = {
  queryBlogContent: async (c: any) => {
    const { query, context, limit, filters } = c.req.valid('json');

    try {
      // Forward request to RAG gateway
      const ragUrl = process.env.NEXT_PUBLIC_RAG_URL || 'http://localhost:3002';
      const response = await fetch(`${ragUrl}/api/rag/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          context,
          limit,
          filters,
          includeSources: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG service error: ${response.statusText}`);
      }

      const result = await response.json();
      return c.json(result);
    } catch (error) {
      console.error('RAG query failed:', error);
      return c.json({ error: 'Failed to process query' }, 500);
    }
  },

  searchBlogPosts: async (c: any) => {
    const { query, limit, threshold, filters } = c.req.valid('json');

    try {
      const ragUrl = process.env.NEXT_PUBLIC_RAG_URL || 'http://localhost:3002';
      const response = await fetch(`${ragUrl}/api/rag/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit,
          threshold,
          filters,
          rerank: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG service error: ${response.statusText}`);
      }

      const result = await response.json();
      return c.json(result);
    } catch (error) {
      console.error('Search failed:', error);
      return c.json({ error: 'Failed to search' }, 500);
    }
  },

  ingestDocuments: async (c: any) => {
    const { force, batchSize } = c.req.valid('json');

    try {
      const ragUrl = process.env.NEXT_PUBLIC_RAG_URL || 'http://localhost:3002';
      const response = await fetch(`${ragUrl}/api/rag/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          force,
          batchSize,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG service error: ${response.statusText}`);
      }

      const result = await response.json();
      return c.json(result);
    } catch (error) {
      console.error('Ingestion failed:', error);
      return c.json({ error: 'Failed to start ingestion' }, 500);
    }
  },

  getIngestionStatus: async (c: any) => {
    const { jobId } = c.req.valid('query');

    try {
      const ragUrl = process.env.NEXT_PUBLIC_RAG_URL || 'http://localhost:3002';
      const response = await fetch(`${ragUrl}/api/rag/ingest/status?jobId=${jobId}`);

      if (!response.ok) {
        throw new Error(`RAG service error: ${response.statusText}`);
      }

      const result = await response.json();
      return c.json(result);
    } catch (error) {
      console.error('Failed to get status:', error);
      return c.json({ error: 'Failed to get ingestion status' }, 500);
    }
  },

  getRAGStats: async (c: any) => {
    try {
      const ragUrl = process.env.NEXT_PUBLIC_RAG_URL || 'http://localhost:3002';

      // Get health check for basic stats
      const healthResponse = await fetch(`${ragUrl}/api/rag/health`);

      if (!healthResponse.ok) {
        throw new Error(`RAG service error: ${healthResponse.statusText}`);
      }

      const health = await healthResponse.json();

      // Transform to expected format
      const stats = {
        documents: {
          total: health.services?.qdrant?.vectorsCount || 0,
          indexed: health.services?.qdrant?.vectorsCount || 0,
          categories: {}, // Would need to be implemented in RAG service
        },
        usage: {
          totalQueries: 0, // Would need to be tracked
          avgQueryTime: 0,
        },
        system: {
          status: health.status,
          uptime: '0m', // Would need to be tracked
        },
      };

      return c.json(stats);
    } catch (error) {
      console.error('Failed to get stats:', error);
      return c.json({ error: 'Failed to get RAG statistics' }, 500);
    }
  },
};
