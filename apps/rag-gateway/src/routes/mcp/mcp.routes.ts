import { InternalServerErrorSchema, NotFoundErrorSchema } from '@/libs/error';
import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';

const tags = ['MCP'];

// Tool parameter schema
const ToolParameterSchema = z.object({
  type: z.string(),
  description: z.string(),
  optional: z.boolean().optional(),
  default: z.any().optional(),
});

// Tool definition schema
const MCPToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.any()),
});

// List tools response
const ListToolsResponseSchema = z.object({
  tools: z.array(MCPToolDefinitionSchema),
  protocol: z.string(),
  version: z.string(),
});

// Invoke tool request
const InvokeToolRequestSchema = z.object({
  tool: z.string().min(1),
  arguments: z.record(z.any()),
  context: z
    .object({
      conversationId: z.string().optional(),
      userId: z.string().optional(),
    })
    .optional(),
});

// Content item schema
const ContentItemSchema = z.object({
  type: z.string(),
  text: z.string(),
});

// Invoke tool response
const InvokeToolResponseSchema = z.object({
  content: z.array(ContentItemSchema),
  isError: z.boolean().optional(),
});

// Explain request
const ExplainRequestSchema = z.object({
  query: z.string().min(1),
  code: z.string().optional(),
  context: z.string().optional(),
});

// Source reference schema
const SourceReferenceSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
});

// Related code example schema
const RelatedCodeExampleSchema = z.object({
  language: z.string(),
  code: z.string(),
  explanation: z.string(),
});

// Explain response
const ExplainResponseSchema = z.object({
  query: z.string(),
  explanation: z.string(),
  sources: z.array(SourceReferenceSchema),
  relatedCode: z.array(RelatedCodeExampleSchema).optional(),
});

export const listTools = createRoute({
  path: '/mcp/tools',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ListToolsResponseSchema, 'Tools listed successfully'),
  },
});

export const invokeTool = createRoute({
  path: '/mcp/invoke',
  method: 'post',
  tags,
  request: {
    body: jsonContentRequired(InvokeToolRequestSchema, 'Tool invocation request'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(InvokeToolResponseSchema, 'Tool invoked successfully'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(NotFoundErrorSchema, 'Tool not found'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Tool invocation failed'
    ),
  },
});

export const explain = createRoute({
  path: '/mcp/explain',
  method: 'post',
  tags,
  request: {
    body: jsonContentRequired(ExplainRequestSchema, 'Explanation request'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ExplainResponseSchema, 'Explanation generated successfully'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContentRequired(
      InternalServerErrorSchema,
      'Explanation failed'
    ),
  },
});
