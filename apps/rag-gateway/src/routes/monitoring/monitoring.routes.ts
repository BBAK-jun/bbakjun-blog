import {
  BadRequestErrorSchema,
  InternalServerErrorSchema,
  UnauthorizedErrorSchema,
} from '@/libs/error';
import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';

const tags = ['Monitoring'];

// Ingestion job schema
const IngestionProgressSchema = z.object({
  total: z.number(),
  processed: z.number(),
  failed: z.number(),
  percentage: z.number(),
  current: z.string(),
});

const IngestionJobSchema = z.object({
  id: z.string(),
  status: z.enum(['running', 'completed', 'failed']),
  progress: IngestionProgressSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});

// Stats schema
const IngestionStatsSchema = z.object({
  totalJobs: z.number(),
  runningJobs: z.number(),
  completedJobs: z.number(),
  failedJobs: z.number(),
  currentJob: IngestionJobSchema.nullable(),
  recentJobs: z.array(IngestionJobSchema),
});

export const getAllJobs = createRoute({
  path: '/monitoring/jobs',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        jobs: z.array(IngestionJobSchema),
      }),
      'All ingestion jobs'
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      InternalServerErrorSchema,
      'Internal server error'
    ),
  },
});

export const getStats = createRoute({
  path: '/monitoring/stats',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(IngestionStatsSchema, 'Ingestion statistics'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      InternalServerErrorSchema,
      'Internal server error'
    ),
  },
});

export const getCurrentJob = createRoute({
  path: '/monitoring/current',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        job: IngestionJobSchema.nullable(),
      }),
      'Current running job'
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      InternalServerErrorSchema,
      'Internal server error'
    ),
  },
});

export const getJobById = createRoute({
  path: '/monitoring/jobs/:id',
  method: 'get',
  tags,
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        job: IngestionJobSchema.nullable(),
      }),
      'Job by ID'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'Invalid job ID'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      InternalServerErrorSchema,
      'Internal server error'
    ),
  },
});
