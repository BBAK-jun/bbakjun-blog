import { createRoute, z } from '@hono/zod-openapi';
import {
  BadRequestErrorSchema,
  InternalServerErrorSchema,
  UnauthorizedErrorSchema,
} from '../../libs/error';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';
import {
  uploadMarkdownRequestSchema,
  uploadImageRequestSchema,
  uploadMultipleImagesRequestSchema,
  uploadMarkdownResponseSchema,
  uploadImageResponseSchema,
  uploadMultipleImagesResponseSchema,
  uploadErrorSchema,
} from '@/shared/api/upload';

const tags = ['Upload'];

export const uploadMarkdown = createRoute({
  path: '/rpc/uploadMarkdown',
  method: 'post',
  tags,
  summary: 'Upload markdown file',
  description: 'Upload markdown file to Vercel Blob (requires API key)',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: uploadMarkdownRequestSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(uploadMarkdownResponseSchema, 'Upload result'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'Invalid request'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});

export const uploadImage = createRoute({
  path: '/rpc/uploadImage',
  method: 'post',
  tags,
  summary: 'Upload image file',
  description: 'Upload image file to Vercel Blob (requires API key)',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: uploadImageRequestSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(uploadImageResponseSchema, 'Upload result'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'Invalid request'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});

export const uploadMultipleImages = createRoute({
  path: '/rpc/uploadMultipleImages',
  method: 'post',
  tags,
  summary: 'Upload multiple image files',
  description: 'Upload multiple image files to Vercel Blob (requires API key)',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: uploadMultipleImagesRequestSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(uploadMultipleImagesResponseSchema, 'Upload results'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'Invalid request'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});
