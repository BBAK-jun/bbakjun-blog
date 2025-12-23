import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getQdrantService } from '../../services/qdrant';
import { getEmbeddingService } from '../../services/embedding';
import { getLLMService } from '../../services/llm';
import { QueryProcessor } from '@repo/rag-core';
import { IngestionPipeline } from '@repo/rag-ingestion';
import { RAGQueryRequestSchema, SearchRequestSchema } from '@repo/rag-types';
import { env } from '../../env';

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

// Ingestion request schema
const ingestRequestSchema = z.object({
  force: z.boolean().default(false),
  batchSize: z.number().min(1).max(100).default(10),
  collections: z.array(z.string()).optional(),
});

// POST /api/rag/ingest - Trigger document ingestion
ragRoutes.post('/ingest', zValidator('json', ingestRequestSchema), async c => {
  const { force, batchSize, collections } = c.req.valid('json');

  try {
    // Initialize services
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();

    // Fetch blob files from blog-admin
    const blobFilesResponse = await fetch(`${env.BLOG_ADMIN_URL}/api/rpc/blob-files`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!blobFilesResponse.ok) {
      throw new Error(`Failed to fetch blob files: ${blobFilesResponse.statusText}`);
    }

    const blobFilesData = (await blobFilesResponse.json()) as {
      files: Array<{ pathname: string; url: string; contentType: string | null }>;
    };
    const blobFiles = blobFilesData.files || [];

    // Filter for markdown files only
    const markdownFiles = blobFiles.filter((f: { pathname: string }) =>
      f.pathname.match(/\.(md|mdx)$/)
    );

    console.log(`📁 Found ${markdownFiles.length} markdown files for ingestion`);

    // Create ingestion pipeline
    const pipeline = new IngestionPipeline(qdrantService, embeddingService);

    // Start ingestion with blob files
    const jobId = await pipeline.startIngestion({
      force,
      batchSize,
      collections,
      blobFiles: markdownFiles,
    });

    return c.json({
      jobId,
      status: 'started',
      message: 'Document ingestion started',
      filesCount: markdownFiles.length,
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
      status: 'running',
      progress: {
        total: 100,
        processed: 50,
        failed: 0,
        percentage: 50,
        current: 'Processing batch 1/2...',
      },
      startedAt: new Date().toISOString(),
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
