import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';
import {
  BadRequestErrorSchema,
  InternalServerErrorSchema,
  UnauthorizedErrorSchema,
} from '../../libs/error';

const tags = ['UploadHistory'];

export const uploadHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().min(1).optional(),
  actionType: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
});

export const uploadHistoryItemSchema = z.object({
  id: z.string(),
  actionType: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  pathname: z.string(),
  fileUrl: z.string().nullable(),
  fileSize: z.number().nullable(),
  contentType: z.string().nullable(),
  uploadedBy: z.string(),
  createdAt: z.date(),
});

export const uploadHistoryResponseSchema = z.object({
  history: z.array(uploadHistoryItemSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export const getUploadHistory = createRoute({
  path: '/rpc/upload-history',
  method: 'get',
  tags,
  summary: 'Get upload history (admin only)',
  description: 'Retrieve upload history with pagination and filters',
  request: {
    query: uploadHistoryQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(uploadHistoryResponseSchema, 'Upload history'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'Invalid request'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});
