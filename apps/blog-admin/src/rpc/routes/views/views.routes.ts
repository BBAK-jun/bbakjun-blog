import { createRoute, z } from '@hono/zod-openapi';
import { BadRequestErrorSchema, InternalServerErrorSchema } from '../../libs/error';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';
import {
  viewsSlugParamSchema,
  viewsIncrementBodySchema,
  viewsGetResponseSchema,
  viewsIncrementResponseSchema,
  viewsStatsResponseSchema,
} from '@/shared/api/views';

const tags = ['Views'];

export const getViewsBySlug = createRoute({
  path: '/rpc/getViewsBySlug/:slug',
  method: 'get',
  tags,
  summary: 'Get view count by slug',
  description: 'Retrieve view count for a specific post',
  request: {
    params: viewsSlugParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(viewsGetResponseSchema, 'View count'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'Invalid slug'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});

export const incrementViewsBySlug = createRoute({
  path: '/rpc/incrementViewsBySlug/:slug',
  method: 'post',
  tags,
  summary: 'Increment view count by slug',
  description: 'Increment view count for a specific post with session-based deduplication',
  request: {
    params: viewsSlugParamSchema,
    body: jsonContentRequired(viewsIncrementBodySchema, 'Increment request'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(viewsIncrementResponseSchema, 'Increment result'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'Invalid parameters'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});

export const getViewsStats = createRoute({
  path: '/rpc/getViewsStats',
  method: 'get',
  tags,
  summary: 'Get view statistics',
  description: 'Retrieve view statistics including total views, popular posts, and recent posts',
  responses: {
    [HttpStatusCodes.OK]: jsonContent(viewsStatsResponseSchema, 'View statistics'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});
