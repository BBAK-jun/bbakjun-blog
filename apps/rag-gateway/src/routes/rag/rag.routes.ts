import { BadRequestErrorSchema, InternalServerErrorSchema } from '@/libs/error';
import { createRoute, z } from '@hono/zod-openapi';
import {
  RAGQueryRequestSchema,
  SearchRequestSchema,
  RAGQueryResponseSchema,
  SearchResponseSchema,
} from '@repo/rag-types';
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
        force: z.boolean().default(false),
        batchSize: z.number().min(1).max(100).default(10),
        collections: z.array(z.string()).optional(),
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
        filesCount: z.number(),
      }),
      'RAG ingest response'
    ),
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
        jobId: z.string(),
        status: z.enum(['pending', 'running', 'completed', 'failed']),
        progress: z.object({
          total: z.number(),
          processed: z.number(),
          failed: z.number(),
          percentage: z.number(),
          current: z.string(),
        }),
        startedAt: z.string().datetime(),
      }),
      'RAG ingest status response'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'RAG ingest status request'),
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
