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
  newsletterBroadcastBodySchema,
  newsletterBroadcastResponseSchema,
  newsletterErrorSchema,
} from '@/shared/api/newsletter';
import { withAdminSession } from '@/rpc/middleware/session';

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
  middleware: withAdminSession,
  tags,
  summary: 'Get newsletter subscribers list (admin)',
  description: 'Retrieve newsletter subscribers list with statistics (requires admin access)',
  responses: {
    [HttpStatusCodes.OK]: jsonContent(newsletterSubscribersResponseSchema, 'Subscribers list'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});

export const sendNewsletterBroadcast = createRoute({
  path: '/rpc/sendNewsletterBroadcast',
  method: 'post',
  middleware: withAdminSession,
  tags,
  summary: 'Send a newsletter broadcast for a published post',
  description: 'Send a published post to active newsletter subscribers (requires admin access)',
  request: {
    body: jsonContentRequired(newsletterBroadcastBodySchema, 'Newsletter broadcast request'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(newsletterBroadcastResponseSchema, 'Broadcast result'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(newsletterErrorSchema, 'Invalid request'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundErrorSchema, 'Published post not found'),
    [HttpStatusCodes.CONFLICT]: jsonContent(newsletterErrorSchema, 'Broadcast already sent'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});
