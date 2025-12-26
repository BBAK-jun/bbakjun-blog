import {
  adminBlobFilesQuerySchema,
  blobFilesQuerySchema,
  blobFilesResponseSchema,
} from '@/shared/api/blob-files';
import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';
import {
  BadRequestErrorSchema,
  InternalServerErrorSchema,
  UnauthorizedErrorSchema,
} from '../../libs/error';

const tags = ['BlobFiles'];

const syncBlobFilesResponseSchema = z.object({
  message: z.string(),
  stats: z.object({
    added: z.number(),
    existing: z.number(),
    deleted: z.number(),
    total: z.number(),
  }),
});

export const getBlobFiles = createRoute({
  path: '/rpc/getBlobFiles',
  method: 'get',
  tags,
  summary: 'Get blob files list (public)',
  description: 'Retrieve blob files from CDC cache (public access)',
  request: {
    query: blobFilesQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(blobFilesResponseSchema, 'Blob files list'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'Invalid request'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});

export const getBlobFilesAdmin = createRoute({
  path: '/rpc/getBlobFilesAdmin',
  method: 'get',
  tags,
  summary: 'Get blob files list (admin)',
  description:
    'Retrieve blob files from CDC cache with auto-sync support (requires authentication)',
  request: {
    query: adminBlobFilesQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(blobFilesResponseSchema, 'Blob files list'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'Invalid request'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});

export const syncBlobFiles = createRoute({
  path: '/rpc/syncBlobFiles',
  method: 'post',
  tags,
  summary: 'Sync blob files manually',
  description: 'Manually trigger blob files synchronization (requires admin authentication)',
  responses: {
    [HttpStatusCodes.OK]: jsonContent(syncBlobFilesResponseSchema, 'Sync result'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});
