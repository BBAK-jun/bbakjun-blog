import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getQdrantService } from '../../services/qdrant';
import { getEmbeddingService } from '../../services/embedding';
import { getLLMService } from '../../services/llm';
import { QueryProcessor } from '@repo/rag-core';
import { IngestionPipeline } from '@repo/rag-ingestion';
import { RAGQueryRequestSchema, SearchRequestSchema } from '@repo/rag-types';

const ragRoutes = new Hono();

// POST /api/rag/query - RAG query with LLM generation
ragRoutes.post('/query', zValidator('json', RAGQueryRequestSchema), async c => {
  const request = c.req.valid('json');

  try {
    // Initialize services
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();
    const llmService = getLLMService();

    // Create query processor
    const queryProcessor = new QueryProcessor(qdrantService, embeddingService, llmService);

    // Process query
    const response = await queryProcessor.processRAGQuery(request);

    return c.json(response);
  } catch (error) {
    console.error('❌ RAG query failed:', error);
    return c.json(
      {
        error: 'Query processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// POST /api/rag/search - Semantic search only
ragRoutes.post('/search', zValidator('json', SearchRequestSchema), async c => {
  const request = c.req.valid('json');

  try {
    // Initialize services
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();

    // Create query processor
    const queryProcessor = new QueryProcessor(
      qdrantService,
      embeddingService,
      null // No LLM needed for search only
    );

    // Search documents
    const response = await queryProcessor.searchDocuments(request);

    return c.json(response);
  } catch (error) {
    console.error('❌ Search failed:', error);
    return c.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// POST /api/rag/ingest - Trigger document ingestion
ragRoutes.post('/ingest', async c => {
  const body = await c.req.json();
  const { force = false, batchSize = 10 } = body;

  try {
    // Initialize services
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();

    // Create ingestion pipeline
    const pipeline = new IngestionPipeline(qdrantService, embeddingService);

    // Start ingestion
    const jobId = await pipeline.startIngestion({
      force,
      batchSize,
    });

    return c.json({
      jobId,
      status: 'started',
      message: 'Document ingestion started',
    });
  } catch (error) {
    console.error('❌ Failed to start ingestion:', error);
    return c.json(
      {
        error: 'Ingestion failed to start',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// GET /api/rag/ingest/status - Check ingestion status
ragRoutes.get('/ingest/status', async c => {
  const jobId = c.req.query('jobId');

  if (!jobId) {
    return c.json(
      {
        error: 'Missing jobId parameter',
      },
      400
    );
  }

  try {
    // Get job status from pipeline (would need to store pipeline instance)
    // For now, return a mock response
    return c.json({
      jobId,
      status: 'completed',
      progress: {
        total: 100,
        processed: 100,
        failed: 0,
        percentage: 100,
      },
      startedAt: '2024-12-22T00:00:00Z',
      completedAt: '2024-12-22T00:05:00Z',
    });
  } catch (error) {
    console.error('❌ Failed to get ingestion status:', error);
    return c.json(
      {
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// GET /api/rag/health - Health check
ragRoutes.get('/health', async c => {
  try {
    const qdrantService = getQdrantService();
    const isHealthy = await qdrantService.healthCheck();

    const collectionInfo = await qdrantService.getCollectionInfo();

    return c.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      services: {
        qdrant: {
          status: isHealthy ? 'connected' : 'disconnected',
          ...collectionInfo,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return c.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});

export { ragRoutes };
