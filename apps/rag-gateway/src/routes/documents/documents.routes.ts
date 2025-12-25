import { InternalServerErrorSchema, NotFoundErrorSchema } from '@/libs/error';
import { createRoute, z } from '@hono/zod-openapi';
import { DocumentSourceSchema } from '@repo/rag-types';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';

const tags = ['Documents'];

// List documents response
const DocumentListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  metadata: z.record(z.any()),
});

const ListDocumentsResponseSchema = z.object({
  documents: z.array(DocumentListItemSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

// Document detail response
const ChunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  position: z.number(),
});

const DocumentDetailResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  chunks: z.array(ChunkSchema),
  metadata: z.record(z.any()),
});

// Create document request
const CreateDocumentRequestSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  slug: z.string().optional(),
  metadata: z
    .object({
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      author: z.string().optional(),
      publishedAt: z.string().datetime().optional(),
      source: DocumentSourceSchema.optional(),
    })
    .optional(),
});

const CreateDocumentResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  status: z.literal('indexed'),
  chunksCreated: z.number(),
  metadata: z.record(z.any()),
});

// Update document request
const UpdateDocumentRequestSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  metadata: z
    .object({
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      author: z.string().optional(),
      publishedAt: z.string().datetime().optional(),
    })
    .optional(),
});

const UpdateDocumentResponseSchema = z.object({
  id: z.string(),
  status: z.literal('updated'),
  chunksReindexed: z.number(),
  updatedAt: z.string(),
});

// Delete document response
const DeleteDocumentResponseSchema = z.object({
  id: z.string(),
  status: z.literal('deleted'),
  chunksDeleted: z.number(),
  deletedAt: z.string(),
});

export const listDocuments = createRoute({
  path: '/documents',
  method: 'get',
  tags,
  request: {
    query: z.object({
      limit: z.string().default('20').optional(),
      offset: z.string().default('0').optional(),
      category: z.string().optional(),
      tags: z.string().optional(),
      author: z.string().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ListDocumentsResponseSchema, 'Documents listed successfully'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Failed to list documents'
    ),
  },
});

export const getDocument = createRoute({
  path: '/documents/{id}',
  method: 'get',
  tags,
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      DocumentDetailResponseSchema,
      'Document retrieved successfully'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundErrorSchema, 'Document not found'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Failed to get document'
    ),
  },
});

export const createDocument = createRoute({
  path: '/documents',
  method: 'post',
  tags,
  request: {
    body: jsonContentRequired(CreateDocumentRequestSchema, 'Document data'),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      CreateDocumentResponseSchema,
      'Document created successfully'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Failed to create document'
    ),
  },
});

export const updateDocument = createRoute({
  path: '/documents/{id}',
  method: 'put',
  tags,
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: jsonContentRequired(UpdateDocumentRequestSchema, 'Document updates'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      UpdateDocumentResponseSchema,
      'Document updated successfully'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundErrorSchema, 'Document not found'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Failed to update document'
    ),
  },
});

export const deleteDocument = createRoute({
  path: '/documents/{id}',
  method: 'delete',
  tags,
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      DeleteDocumentResponseSchema,
      'Document deleted successfully'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundErrorSchema, 'Document not found'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Failed to delete document'
    ),
  },
});
