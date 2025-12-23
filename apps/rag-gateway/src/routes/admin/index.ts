import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getQdrantService } from '../../services/qdrant';
import { getEmbeddingService } from '../../services/embedding';
import { getLLMService } from '../../services/llm';
import { IngestionPipeline } from '@repo/rag-ingestion';
import { env } from '../../env';

const adminRoutes = new Hono();

// Reindex schema
const reindexSchema = z.object({
  force: z.boolean().default(false),
  batchSize: z.number().min(1).max(100).default(10),
  collections: z.array(z.string()).optional(),
});

// Store for tracking reindex jobs
const reindexJobs = new Map<
  string,
  {
    status: 'running' | 'completed' | 'failed';
    progress: { total: number; processed: number; failed: number; percentage: number };
    startedAt: string;
    completedAt?: string;
    errors: Array<{ documentId: string; error: string; timestamp: string }>;
  }
>();

// GET /api/admin/stats - Get usage statistics
adminRoutes.get('/stats', async c => {
  try {
    const qdrantService = getQdrantService();
    const collectionInfo = await qdrantService.getCollectionInfo();

    // Get document counts by scrolling through all points
    const allPoints = await qdrantService.scrollPoints(undefined, 1000);

    // Count documents and categorize
    const docCounts = new Map<string, number>();
    const processedDocIds = new Set<string>();

    for (const point of allPoints.points) {
      const docId = point.documentId as string;
      if (!processedDocIds.has(docId)) {
        processedDocIds.add(docId);
        const metadata = point.metadata as Record<string, unknown>;
        const category = (metadata.category as string) || 'uncategorized';
        docCounts.set(category, (docCounts.get(category) || 0) + 1);
      }
    }

    // Convert map to object
    const categories: Record<string, number> = {};
    docCounts.forEach((count, category) => {
      categories[category] = count;
    });

    // Get embedding cache stats
    const embeddingService = getEmbeddingService();
    const cacheStats = embeddingService.getCacheStats();

    return c.json({
      documents: {
        total: processedDocIds.size,
        indexed: collectionInfo.vectorsCount,
        failed: 0, // Would need to track this separately
        categories,
      },
      usage: {
        totalQueries: 0, // Would need to track this separately
        avgQueryTime: 0,
        topQueries: [],
      },
      performance: {
        qdrant: {
          avgSearchTime: 0, // Would need to track this
          totalCollections: 1,
          totalVectors: collectionInfo.vectorsCount,
        },
        llm: {
          avgGenerationTime: 0, // Would need to track this
          totalTokens: 0,
          avgTokensPerQuery: 0,
        },
      },
      system: {
        uptime: '0h 0m', // Would need process start time
        version: '0.1.0',
        lastIngestion: null, // Would need to track this
        cacheHitRate: cacheStats.size > 0 ? 0.5 : 0, // Rough estimate
      },
    });
  } catch (error) {
    console.error('❌ Failed to get stats:', error);
    return c.json({ error: 'Failed to get stats', details: String(error) }, 500);
  }
});

// GET /api/admin/logs - Get system logs
adminRoutes.get('/logs', async c => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 1000);
  const _level = c.req.query('level') || 'info';
  const _since = c.req.query('since');

  // TODO: Implement log retrieval from file or database
  // For now, return empty logs
  return c.json({
    logs: [],
    pagination: {
      total: 0,
      limit,
      hasMore: false,
    },
  });
});

// POST /api/admin/reindex - Reindex all documents
adminRoutes.post('/reindex', zValidator('json', reindexSchema), async c => {
  const { force, batchSize, collections } = c.req.valid('json');

  try {
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

    // Create job ID
    const jobId = `reindex_${Date.now()}`;

    // Initialize job tracking
    reindexJobs.set(jobId, {
      status: 'running',
      progress: {
        total: markdownFiles.length,
        processed: 0,
        failed: 0,
        percentage: 0,
      },
      startedAt: new Date().toISOString(),
      errors: [],
    });

    // Start reindexing in background
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();
    const pipeline = new IngestionPipeline(qdrantService, embeddingService);

    // Run in background
    pipeline
      .startIngestion({
        force,
        batchSize,
        collections,
        blobFiles: markdownFiles,
      })
      .then(() => {
        const job = reindexJobs.get(jobId);
        if (job) {
          job.status = 'completed';
          job.progress.percentage = 100;
          job.progress.processed = job.progress.total;
          job.completedAt = new Date().toISOString();
        }
      })
      .catch(error => {
        const job = reindexJobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.completedAt = new Date().toISOString();
          job.errors.push({
            documentId: 'unknown',
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
        }
      });

    // Estimate time based on file count
    const estimatedMinutes = Math.ceil(markdownFiles.length / 10); // Rough estimate

    return c.json({
      jobId,
      status: 'started',
      config: {
        force,
        batchSize,
        collections: collections || ['all'],
      },
      estimatedTime: `~${estimatedMinutes} minutes`,
    });
  } catch (error) {
    console.error('❌ Failed to start reindex:', error);
    return c.json({ error: 'Reindex failed to start', details: String(error) }, 500);
  }
});

// GET /api/admin/reindex/:jobId - Get reindex status
adminRoutes.get('/reindex/:jobId', async c => {
  const jobId = c.req.param('jobId');
  const job = reindexJobs.get(jobId);

  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }

  return c.json({
    jobId,
    status: job.status,
    progress: job.progress,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    errors: job.errors,
  });
});

// DELETE /api/admin/cache - Clear caches
adminRoutes.delete('/cache', async c => {
  const cacheType = c.req.query('type') || 'all';

  try {
    const embeddingService = getEmbeddingService();
    const beforeStats = embeddingService.getCacheStats();

    // Clear embedding cache
    embeddingService.clearCache();

    return c.json({
      message: 'Cache cleared',
      type: cacheType,
      clearedAt: new Date().toISOString(),
      sizes: {
        embedding: `${(beforeStats.memoryEstimate / 1024 / 1024).toFixed(2)}MB`,
      },
    });
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
    return c.json({ error: 'Failed to clear cache', details: String(error) }, 500);
  }
});

// GET /api/admin/health - Detailed health check
adminRoutes.get('/health', async c => {
  try {
    const qdrantService = getQdrantService();
    const qdrantHealthy = await qdrantService.healthCheck();

    const collectionInfo = await qdrantService.getCollectionInfo();

    // Check LLM service (simple ping)
    let llmHealthy = false;
    let llmResponseTime = 0;
    try {
      const llmService = getLLMService();
      const start = Date.now();
      // Simple health check - try to generate a minimal RAG response
      await llmService.generateRAGResponse(
        {
          query: 'health check',
          limit: 1,
          temperature: 0.7,
          includeSources: false,
          stream: false,
        },
        []
      );
      llmResponseTime = Date.now() - start;
      llmHealthy = true;
    } catch {
      llmHealthy = false;
    }

    return c.json({
      status: qdrantHealthy && llmHealthy ? 'healthy' : 'unhealthy',
      components: {
        qdrant: {
          status: qdrantHealthy ? 'healthy' : 'unhealthy',
          responseTime: 0, // Would need to measure
          collections: 1,
          vectorsCount: collectionInfo.vectorsCount,
        },
        llm: {
          status: llmHealthy ? 'healthy' : 'unhealthy',
          provider: 'GLM-4.6',
          responseTime: llmResponseTime,
        },
        redis: {
          status: 'unknown', // Redis is optional
          connected: false,
          memory: 'N/A',
        },
        storage: {
          status: 'healthy', // Would need to check disk space
          free: 'N/A',
          usage: collectionInfo.diskDataSize
            ? `${(collectionInfo.diskDataSize / 1024 / 1024).toFixed(2)}MB`
            : 'N/A',
        },
      },
      uptime: '0h 0m', // Would need process start time
      version: '0.1.0',
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return c.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      503
    );
  }
});

export { adminRoutes };
