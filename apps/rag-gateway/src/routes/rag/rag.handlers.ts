import { AppRouteHandler } from '@/libs';
import { InternalServerErrorSchema } from '@/libs/error';
import { getEmbeddingService } from '@/services/embedding';
import { getLLMService } from '@/services/llm';
import { getQdrantService } from '@/services/qdrant';
import { z } from '@hono/zod-openapi';
import { QueryProcessor } from '@repo/rag-core';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import * as routes from './rag.routes';
import { IngestionPipeline } from '@repo/rag-ingestion';
import { env } from '@/env';

export const query: AppRouteHandler<typeof routes.query> = async c => {
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

    return c.json(response, HttpStatusCodes.OK);
  } catch (error) {
    return c.json(
      {
        error: '❌ RAG query failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      } satisfies z.infer<typeof InternalServerErrorSchema>,
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const search: AppRouteHandler<typeof routes.search> = async c => {
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

    return c.json(response, HttpStatusCodes.OK);
  } catch (error) {
    console.error('❌ Search failed:', error);
    return c.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const ingest: AppRouteHandler<typeof routes.ingest> = async c => {
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

    const response = {
      jobId,
      status: 'started' as const,
      message: 'Document ingestion started',
      filesCount: markdownFiles.length,
    };

    return c.json(response, HttpStatusCodes.OK);
  } catch (error) {
    console.error('❌ Failed to start ingestion:', error);
    return c.json(
      {
        error: 'Ingestion failed to start',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const ingestStatus: AppRouteHandler<typeof routes.ingestStatus> = async c => {
  const jobId = c.req.query('jobId');

  if (!jobId) {
    return c.json(
      {
        error: 'Missing jobId parameter',
        message: '',
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  try {
    // Get job status from pipeline (would need to store pipeline instance)
    // For now, return a mock response
    return c.json(
      {
        jobId,
        status: 'running' as const,
        progress: {
          total: 100,
          processed: 50,
          failed: 0,
          percentage: 50,
          current: 'Processing batch 1/2...',
        },
        startedAt: new Date().toISOString(),
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error('❌ Failed to get ingestion status:', error);
    return c.json(
      {
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const health: AppRouteHandler<typeof routes.health> = async c => {
  try {
    // Check if services are initialized
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();

    // Basic health check - verify services are accessible
    const isHealthy = qdrantService !== null && embeddingService !== null;

    return c.json(
      {
        status: isHealthy ? ('healthy' as const) : ('unhealthy' as const),
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return c.json(
      {
        status: 'unhealthy' as const,
      },
      HttpStatusCodes.OK // Always return OK, status indicates health
    );
  }
};
