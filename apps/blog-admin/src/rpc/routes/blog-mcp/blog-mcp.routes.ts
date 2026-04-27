import {
  BadRequestErrorSchema,
  InternalServerErrorSchema,
  NotFoundErrorSchema,
  UnauthorizedErrorSchema,
} from '@/rpc/libs/error';
import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';

const tags = ['Blog MCP'];

const BlogMcpToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  requiredScopes: z.array(z.string()),
  inputSchema: z.record(z.string(), z.unknown()),
});

const ListToolsResponseSchema = z.object({
  tools: z.array(BlogMcpToolDefinitionSchema),
  protocol: z.literal('blog-mcp'),
  version: z.string(),
});

const InvokeToolRequestSchema = z.object({
  tool: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
});

const InvokeToolResponseSchema = z.object({
  content: z.array(
    z.object({
      type: z.literal('text'),
      text: z.string(),
    })
  ),
  isError: z.boolean().optional(),
});

export const listTools = createRoute({
  path: '/rpc/blog-mcp/tools',
  method: 'get',
  tags,
  summary: 'List Blog MCP tools',
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ListToolsResponseSchema, 'Blog MCP tools'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
  },
});

export const invokeTool = createRoute({
  path: '/rpc/blog-mcp/invoke',
  method: 'post',
  tags,
  summary: 'Invoke a Blog MCP tool',
  request: {
    body: jsonContentRequired(InvokeToolRequestSchema, 'Tool invocation request'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(InvokeToolResponseSchema, 'Tool result'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(BadRequestErrorSchema, 'Invalid request'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(UnauthorizedErrorSchema, 'Unauthorized'),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(UnauthorizedErrorSchema, 'Forbidden'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundErrorSchema, 'Tool or post not found'),
    [HttpStatusCodes.CONFLICT]: jsonContent(BadRequestErrorSchema, 'Conflict'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Tool invocation failed'
    ),
  },
});
