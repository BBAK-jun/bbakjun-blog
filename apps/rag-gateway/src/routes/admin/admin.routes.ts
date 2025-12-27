import { InternalServerErrorSchema, NotFoundErrorSchema } from '@/libs/error';
import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';

const tags = ['Admin'];

// Stats schemas
const UsageStatsSchema = z.object({
  totalQueries: z.number(),
  avgQueryTime: z.number(),
  topQueries: z.array(z.string()),
});

const QdrantStatsSchema = z.object({
  avgSearchTime: z.number(),
  totalCollections: z.number(),
  totalVectors: z.number(),
});

const LLMStatsSchema = z.object({
  avgGenerationTime: z.number(),
  totalTokens: z.number(),
  avgTokensPerQuery: z.number(),
});

const SystemStatsSchema = z.object({
  uptime: z.string(),
  version: z.string(),
  lastIngestion: z.string().nullable(),
  cacheHitRate: z.number(),
});

const DocumentsStatsSchema = z.object({
  total: z.number(),
  indexed: z.number(),
  failed: z.number(),
  categories: z.record(z.number()),
});

const PerformanceStatsSchema = z.object({
  qdrant: QdrantStatsSchema,
  llm: LLMStatsSchema,
});

const StatsResponseSchema = z.object({
  documents: DocumentsStatsSchema,
  usage: UsageStatsSchema,
  performance: PerformanceStatsSchema,
  system: SystemStatsSchema,
});

// Logs schemas
const LogEntrySchema = z.object({
  timestamp: z.string(),
  level: z.string(),
  message: z.string(),
  context: z.record(z.any()).optional(),
});

const LogsResponseSchema = z.object({
  logs: z.array(LogEntrySchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    hasMore: z.boolean(),
  }),
});

// Reindex schemas
const ReindexRequestSchema = z.object({
  force: z.boolean().default(false),
  batchSize: z.number().min(1).max(100).default(10),
  collections: z.array(z.string()).optional(),
});

const ReindexConfigSchema = z.object({
  force: z.boolean(),
  batchSize: z.number(),
  collections: z.array(z.string()),
});

const ReindexResponseSchema = z.object({
  jobId: z.string(),
  status: z.literal('started'),
  config: ReindexConfigSchema,
  estimatedTime: z.string(),
});

const JobProgressSchema = z.object({
  total: z.number(),
  processed: z.number(),
  failed: z.number(),
  percentage: z.number(),
});

const JobErrorSchema = z.object({
  documentId: z.string(),
  error: z.string(),
  timestamp: z.string(),
});

const ReindexStatusResponseSchema = z.object({
  jobId: z.string(),
  status: z.enum(['running', 'completed', 'failed']),
  progress: JobProgressSchema,
  startedAt: z.string(),
  completedAt: z.string().optional(),
  errors: z.array(JobErrorSchema),
});

// Cache schemas
const CacheSizesSchema = z.object({
  embedding: z.string(),
});

const ClearCacheResponseSchema = z.object({
  message: z.string(),
  type: z.string(),
  clearedAt: z.string(),
  sizes: CacheSizesSchema,
});

// Health schemas
const ComponentHealthSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'unknown']),
  responseTime: z.number().optional(),
  collections: z.number().optional(),
  vectorsCount: z.number().optional(),
  provider: z.string().optional(),
  connected: z.boolean().optional(),
  memory: z.string().optional(),
  free: z.string().optional(),
  usage: z.string().optional(),
});

const HealthComponentsSchema = z.object({
  qdrant: ComponentHealthSchema,
  llm: ComponentHealthSchema,
  redis: ComponentHealthSchema,
  storage: ComponentHealthSchema,
});

const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  components: HealthComponentsSchema,
  uptime: z.string(),
  version: z.string(),
});

const HealthErrorResponseSchema = z.object({
  status: z.literal('unhealthy'),
  error: z.string(),
});

// Clear collection schemas
const ClearCollectionRequestSchema = z.object({
  confirm: z.literal('yes', {
    errorMap: () => ({ message: 'Must confirm by passing confirm=yes' }),
  }),
});

const ClearCollectionResponseSchema = z.object({
  message: z.string(),
  deletedCount: z.number(),
  clearedAt: z.string(),
});

export const getStats = createRoute({
  path: '/admin/stats',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(StatsResponseSchema, 'Statistics retrieved successfully'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Failed to get stats'
    ),
  },
});

export const getLogs = createRoute({
  path: '/admin/logs',
  method: 'get',
  tags,
  request: {
    query: z.object({
      limit: z.string().default('50').optional(),
      level: z.string().default('info').optional(),
      since: z.string().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(LogsResponseSchema, 'Logs retrieved successfully'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Failed to get logs'
    ),
  },
});

export const createReindex = createRoute({
  path: '/admin/reindex',
  method: 'post',
  tags,
  request: {
    body: jsonContentRequired(ReindexRequestSchema, 'Reindex request'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ReindexResponseSchema, 'Reindex started successfully'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Failed to start reindex'
    ),
  },
});

export const getReindexStatus = createRoute({
  path: '/admin/reindex/{jobId}',
  method: 'get',
  tags,
  request: {
    params: z.object({
      jobId: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ReindexStatusResponseSchema, 'Reindex status retrieved'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundErrorSchema, 'Job not found'),
  },
});

export const clearCache = createRoute({
  path: '/admin/cache',
  method: 'delete',
  tags,
  request: {
    query: z.object({
      type: z.string().default('all').optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ClearCacheResponseSchema, 'Cache cleared successfully'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Failed to clear cache'
    ),
  },
});

export const getHealth = createRoute({
  path: '/admin/health',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(HealthResponseSchema, 'Health check completed'),
    [HttpStatusCodes.SERVICE_UNAVAILABLE]: jsonContentRequired(
      HealthErrorResponseSchema,
      'Service unhealthy'
    ),
  },
});

export const clearCollection = createRoute({
  path: '/admin/collection',
  method: 'delete',
  tags,
  request: {
    body: jsonContentRequired(ClearCollectionRequestSchema, 'Confirmation required'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ClearCollectionResponseSchema, 'Collection cleared successfully'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContentRequired(
      ClearCollectionRequestSchema,
      'Must confirm with confirm=yes'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Failed to clear collection'
    ),
  },
});
