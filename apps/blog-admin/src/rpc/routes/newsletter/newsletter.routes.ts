import { createRoute, z } from '@hono/zod-openapi';
import {
  InternalServerErrorSchema,
  NotFoundErrorSchema,
  UnauthorizedErrorSchema,
} from '../../libs/error';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';
import {
  newsletterSubscribeBodySchema,
  newsletterUnsubscribeBodySchema,
  newsletterSubscribeResponseSchema,
  newsletterUnsubscribeResponseSchema,
  newsletterSubscribersResponseSchema,
  newsletterErrorSchema,
} from '@/shared/api/newsletter';

const tags = ['Newsletter'];

export const subscribeNewsletter = createRoute({
  path: '/rpc/subscribeNewsletter',
  method: 'post',
  tags,
  summary: 'Subscribe to newsletter',
  description: 'Subscribe to the newsletter with email',
  request: {
    body: jsonContentRequired(newsletterSubscribeBodySchema, 'Subscription request'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(newsletterSubscribeResponseSchema, 'Subscription result'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(newsletterErrorSchema, 'Invalid request'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});

export const unsubscribeNewsletter = createRoute({
  path: '/rpc/unsubscribeNewsletter',
  method: 'post',
  tags,
  summary: 'Unsubscribe from newsletter',
  description: 'Unsubscribe from the newsletter using token',
  request: {
    body: jsonContentRequired(newsletterUnsubscribeBodySchema, 'Unsubscription request'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(newsletterUnsubscribeResponseSchema, 'Unsubscription result'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(newsletterErrorSchema, 'Invalid request'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundErrorSchema, 'Subscriber not found'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});

export const getNewsletterSubscribers = createRoute({
  path: '/rpc/getNewsletterSubscribers',
  method: 'get',
  tags,
  summary: 'Get newsletter subscribers list (admin)',
  description: 'Retrieve newsletter subscribers list with statistics (requires admin access)',
  responses: {
    [HttpStatusCodes.OK]: jsonContent(newsletterSubscribersResponseSchema, 'Subscribers list'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});
