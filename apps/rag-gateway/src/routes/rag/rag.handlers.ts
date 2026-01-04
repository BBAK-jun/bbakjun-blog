import { AppRouteHandler } from '@/libs';
import { BadRequestErrorSchema, InternalServerErrorSchema } from '@/libs/error';
import { getEmbeddingService } from '@/services/embedding';
import { getLLMService } from '@/services/llm';
import { getQdrantService } from '@/services/qdrant';
import { z } from '@hono/zod-openapi';
import { QueryProcessor } from '../../lib/rag/core';
import { IngestionPipeline } from '../../lib/rag/ingestion';
import { generateDocumentId } from '../../lib/rag/types';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import * as routes from './rag.routes';
import { sanitizeInput } from '@/middleware/input-validation';
import { filterRAGResponse } from '@/middleware/output-filter';

export const query: AppRouteHandler<typeof routes.query> = async c => {
  const request = c.req.valid('json');

  try {
    // Validate and sanitize input for prompt injection
    const sanitizedQuery = sanitizeInput(request.query);

    // Initialize services
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();
    const llmService = getLLMService();

    // Create query processor
    const queryProcessor = new QueryProcessor(qdrantService, embeddingService, llmService);

    // Process query with sanitized input
    const response = await queryProcessor.processRAGQuery({
      ...request,
      query: sanitizedQuery,
    });

    // Filter sensitive information from response
    const filteredResponse = filterRAGResponse(response);

    return c.json(filteredResponse, HttpStatusCodes.OK);
  } catch (error) {
    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('Invalid input detected')) {
      return c.json(
        {
          error: 'Invalid input',
          message: error.message,
        } satisfies z.infer<typeof BadRequestErrorSchema>,
        HttpStatusCodes.BAD_REQUEST
      );
    }

    return c.json(
      {
        error: 'RAG query failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      } satisfies z.infer<typeof InternalServerErrorSchema>,
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const search: AppRouteHandler<typeof routes.search> = async c => {
  const request = c.req.valid('json');

  try {
    // Validate and sanitize input for prompt injection
    const sanitizedQuery = sanitizeInput(request.query);

    // Initialize services
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();

    // Create query processor
    const queryProcessor = new QueryProcessor(
      qdrantService,
      embeddingService,
      null // No LLM needed for search only
    );

    // Search documents with sanitized input
    const response = await queryProcessor.searchDocuments({
      ...request,
      query: sanitizedQuery,
    });

    // Filter sensitive information from response
    const filteredResponse = filterRAGResponse(response);

    return c.json(filteredResponse, HttpStatusCodes.OK);
  } catch (error) {
    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('Invalid input detected')) {
      return c.json(
        {
          error: 'Invalid input',
          message: error.message,
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    console.error('Search failed:', error);
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
  const { documents, force, batchSize } = c.req.valid('json');

  try {
    // Initialize services
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();

    // Convert request documents to Document format
    const docs = await Promise.all(
      documents.map(async (doc) => ({
        id: doc.id || (await generateDocumentId('claude-docs', doc.slug)),
        content: doc.content,
        metadata: {
          title: doc.title,
          slug: doc.slug,
          author: doc.metadata.author || 'claude-code',
          category: doc.metadata.category,
          tags: doc.metadata.tags || [],
          publishedAt: new Date().toISOString(),
          wordCount: doc.content.split(/\s+/).length,
          language: 'ko',
          source: 'upload' as const,
          sourceUrl: doc.metadata.githubUrl,
          uploadedAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
      }))
    );

    // Create ingestion pipeline
    const pipeline = new IngestionPipeline(qdrantService, embeddingService);

    // Start ingestion with documents
    const jobId = await pipeline.startIngestion({
      force,
      batchSize,
      documents: docs,
    });

    const response = {
      jobId,
      status: 'started' as const,
      message: 'Document ingestion started',
      documentsCount: documents.length,
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
  const jobId = c.req.valid('query').jobId;

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
    // Get job status from pipeline
    const pipeline = new IngestionPipeline(getQdrantService(), getEmbeddingService());
    const job = pipeline.getJobStatus(jobId);

    if (!job) {
      return c.json(
        {
          error: 'Job not found',
          message: `Job ${jobId} not found`,
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    return c.json(job, HttpStatusCodes.OK);
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
