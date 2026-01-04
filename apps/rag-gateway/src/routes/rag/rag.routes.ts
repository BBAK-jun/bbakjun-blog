import {
  BadRequestErrorSchema,
  InternalServerErrorSchema,
  TooManyRequestsErrorSchema,
  UnauthorizedErrorSchema,
} from '@/libs/error';
import { createRoute, z } from '@hono/zod-openapi';
import {
  RAGQueryRequestSchema,
  SearchRequestSchema,
  RAGQueryResponseSchema,
  SearchResponseSchema,
} from '../../lib/rag/types';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';

const tags = ['RAG'];

export const query = createRoute({
  path: '/rag/query',
  method: 'post',
  tags,
  request: {
    body: jsonContentRequired(RAGQueryRequestSchema, 'RAG query request'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(RAGQueryResponseSchema, 'RAG query response'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'Invalid input'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      TooManyRequestsErrorSchema,
      'Rate limit exceeded'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Internal server error'
    ),
  },
});

export const search = createRoute({
  path: '/rag/search',
  method: 'post',
  tags,
  request: {
    body: jsonContentRequired(SearchRequestSchema, 'RAG search request'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(SearchResponseSchema, 'RAG search response'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'Invalid input'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      TooManyRequestsErrorSchema,
      'Rate limit exceeded'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Internal server error'
    ),
  },
});

export const ingest = createRoute({
  path: '/rag/ingest',
  method: 'post',
  tags,
  request: {
    body: jsonContentRequired(
      z.object({
        documents: z.array(
          z.object({
            id: z.string().optional(),
            title: z.string(),
            content: z.string(),
            slug: z.string(),
            metadata: z.object({
              category: z.string(),
              tags: z.array(z.string()).optional(),
              author: z.string().optional(),
              description: z.string().optional(),
              githubUrl: z.string().url().optional(),
            }),
          })
        ),
        force: z.boolean().default(false),
        batchSize: z.number().min(1).max(100).default(10),
      }),
      'RAG ingest request'
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        jobId: z.string(),
        status: z.literal('started'),
        message: z.string(),
        documentsCount: z.number(),
      }),
      'RAG ingest response'
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Internal server error'
    ),
  },
});

export const ingestStatus = createRoute({
  path: '/rag/ingest/status',
  method: 'get',
  tags,
  request: {
    query: z.object({
      jobId: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        id: z.string(),
        status: z.enum(['running', 'completed', 'failed']),
        progress: z.object({
          total: z.number(),
          processed: z.number(),
          failed: z.number(),
          percentage: z.number(),
          current: z.string(),
        }),
        startedAt: z.string().datetime(),
        completedAt: z.string().datetime().optional(),
        error: z.string().optional(),
      }).nullable(),
      'RAG ingest status response'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'RAG ingest status request'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Internal server error'
    ),
  },
});

export const health = createRoute({
  path: '/rag/health',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        status: z.enum(['healthy', 'unhealthy']),
      }),
      'RAG health response'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Internal server error'
    ),
  },
});
