import type { AppRouteHandler } from '@/rpc/libs';
import { env } from '@/env';
import {
  assertBlogMcpScope,
  type BlogMcpActor,
  type BlogMcpScope,
  verifyBlogMcpApiKey,
} from '@/shared/lib/auth/blog-mcp-auth';
import { validateBlogPost } from '@/shared/lib/blog-post/validate-post';
import { auditBlogMcpTool } from '@/shared/server/blog-mcp-audit';
import {
  BlogMcpError,
  deleteAgentPost,
  getAgentPost,
  listAgentPosts,
  uploadAgentImage,
  upsertAgentPost,
} from '@/shared/server/blog-mcp-posts';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import * as routes from './blog-mcp.routes';

type ToolName =
  | 'list_posts'
  | 'get_post'
  | 'validate_post'
  | 'upsert_post'
  | 'delete_post'
  | 'upload_image'
  | 'revalidate_post'
  | 'index_post_for_rag'
  | 'publish_post';

const BLOG_MCP_TOOLS: Array<{
  name: ToolName;
  description: string;
  requiredScopes: BlogMcpScope[];
  inputSchema: Record<string, unknown>;
}> = [
  {
    name: 'list_posts',
    description: 'List markdown/MDX posts known by the Blob CDC cache',
    requiredScopes: ['blog:read'],
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        category: { type: 'string' },
        tag: { type: 'string' },
        draft: { type: 'boolean' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  },
  {
    name: 'get_post',
    description: 'Fetch a raw markdown/MDX post from Vercel Blob and return its hash',
    requiredScopes: ['blog:read'],
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['pathname'],
      properties: { pathname: { type: 'string' } },
    },
  },
  {
    name: 'validate_post',
    description: 'Validate post pathname and required front matter without writing',
    requiredScopes: ['blog:read'],
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['content'],
      properties: {
        pathname: { type: 'string' },
        content: { type: 'string' },
        draft: { type: 'boolean' },
      },
    },
  },
  {
    name: 'upsert_post',
    description: 'Create or update a markdown/MDX post in Vercel Blob, then sync CDC',
    requiredScopes: ['blog:write'],
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['pathname', 'content'],
      properties: {
        pathname: { type: 'string' },
        content: { type: 'string' },
        expectedHash: { type: 'string' },
        draft: { type: 'boolean' },
        dryRun: { type: 'boolean' },
      },
    },
  },
  {
    name: 'delete_post',
    description: 'Delete a post from Vercel Blob with expectedHash and exact confirmation guard',
    requiredScopes: ['blog:delete'],
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['pathname', 'expectedHash', 'confirm'],
      properties: {
        pathname: { type: 'string' },
        expectedHash: { type: 'string' },
        confirm: { type: 'string' },
        dryRun: { type: 'boolean' },
      },
    },
  },
  {
    name: 'upload_image',
    description: 'Upload a base64 image to Vercel Blob and return markdown image syntax',
    requiredScopes: ['blog:write'],
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['filename', 'contentBase64'],
      properties: {
        filename: { type: 'string' },
        contentBase64: { type: 'string' },
        alt: { type: 'string' },
        dryRun: { type: 'boolean' },
      },
    },
  },
  {
    name: 'revalidate_post',
    description: 'Request public blog ISR revalidation for a slug',
    requiredScopes: ['blog:publish'],
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['slug'],
      properties: { slug: { type: 'string' } },
    },
  },
  {
    name: 'index_post_for_rag',
    description: 'Read a Blob post and send it to the RAG Gateway document index',
    requiredScopes: ['blog:publish'],
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['pathname'],
      properties: { pathname: { type: 'string' } },
    },
  },
  {
    name: 'publish_post',
    description: 'Validate, upsert, revalidate, and index a post in one guarded workflow',
    requiredScopes: ['blog:write', 'blog:publish'],
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['pathname', 'content'],
      properties: {
        pathname: { type: 'string' },
        content: { type: 'string' },
        expectedHash: { type: 'string' },
        dryRun: { type: 'boolean' },
      },
    },
  },
];

function authorize(c: { req: { header: (name: string) => string | undefined }; json: (body: unknown, status: number) => Response }): BlogMcpActor | Response {
  const actor = verifyBlogMcpApiKey(c.req.header('authorization'));
  if (!actor) {
    return c.json(
      { error: 'Unauthorized', message: 'Missing or invalid Blog MCP API key' },
      HttpStatusCodes.UNAUTHORIZED
    );
  }
  return actor;
}

function requireScopes(actor: BlogMcpActor, scopes: BlogMcpScope[]) {
  for (const scope of scopes) {
    try {
      assertBlogMcpScope(actor, scope);
    } catch (error) {
      throw new BlogMcpError(error instanceof Error ? error.message : 'Forbidden', 403);
    }
  }
}

function jsonResult(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function getString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new BlogMcpError(`${key} is required`, 400);
  }
  return value;
}

function normalizeBlogSlug(slugInput: string): string {
  const slug = slugInput.trim().replace(/^\/+|\/+$/g, '').replace(/^blog\//, '');
  if (!slug || slug.includes('..') || slug.includes('\\')) {
    throw new BlogMcpError('Invalid slug', 400);
  }
  if (!/^[a-zA-Z0-9/_-]+$/.test(slug)) {
    throw new BlogMcpError('Invalid slug characters', 400);
  }
  return slug;
}

function sanitizeUpstreamError(prefix: string, response: Response): BlogMcpError {
  return new BlogMcpError(`${prefix} failed with status ${response.status}`, 502);
}

async function revalidatePost(slugInput: string) {
  if (!env.REVALIDATION_SECRET) {
    throw new BlogMcpError('REVALIDATION_SECRET is not configured', 500);
  }

  const slug = normalizeBlogSlug(slugInput);
  const path = `/blog/${slug}`;
  const url = new URL('/api/revalidate', env.NEXT_PUBLIC_BLOG_URL);
  url.searchParams.set('secret', env.REVALIDATION_SECRET);
  url.searchParams.set('path', path);

  const response = await fetch(url, { method: 'POST' });
  const body = await response.text();
  if (!response.ok) {
    throw sanitizeUpstreamError('Revalidation', response);
  }

  return { path, status: response.status, response: body };
}

async function indexPostForRag(pathname: string) {
  const post = await getAgentPost(pathname);
  if (!post.validation.frontMatter) {
    throw new BlogMcpError('Cannot index post without valid front matter', 400);
  }

  const slug = post.pathname.replace(/\.(md|mdx)$/i, '');
  const response = await fetch(new URL('/api/documents', env.NEXT_PUBLIC_RAG_GATEWAY_URL), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RAG-API-Key': env.RAG_GATEWAY_API_KEY,
    },
    body: JSON.stringify({
      title: post.validation.frontMatter.title,
      content: post.content,
      slug: `/blog/${slug}`,
      metadata: {
        category: slug.split('/')[0],
        tags: post.validation.frontMatter.tags,
        author: post.validation.frontMatter.author,
        publishedAt: new Date(post.validation.frontMatter.date).toISOString(),
        source: 'blog',
      },
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw sanitizeUpstreamError('RAG indexing', response);
  }

  return { pathname: post.pathname, slug, status: response.status, response: body };
}

async function invoke(tool: ToolName, args: Record<string, unknown>, actor: BlogMcpActor) {
  const toolDefinition = BLOG_MCP_TOOLS.find(item => item.name === tool);
  if (!toolDefinition) {
    throw new BlogMcpError(`Tool not found: ${tool}`, 404);
  }

  requireScopes(actor, toolDefinition.requiredScopes);

  switch (tool) {
    case 'list_posts':
      return listAgentPosts({
        category: typeof args.category === 'string' ? args.category : undefined,
        tag: typeof args.tag === 'string' ? args.tag : undefined,
        draft: typeof args.draft === 'boolean' ? args.draft : undefined,
        limit: typeof args.limit === 'number' ? args.limit : undefined,
        offset: typeof args.offset === 'number' ? args.offset : undefined,
      });
    case 'get_post':
      return getAgentPost(getString(args, 'pathname'));
    case 'validate_post':
      return validateBlogPost({
        pathname: typeof args.pathname === 'string' ? args.pathname : undefined,
        content: getString(args, 'content'),
        draft: typeof args.draft === 'boolean' ? args.draft : undefined,
      });
    case 'upsert_post':
      return upsertAgentPost({
        pathname: getString(args, 'pathname'),
        content: getString(args, 'content'),
        expectedHash: typeof args.expectedHash === 'string' ? args.expectedHash : undefined,
        draft: typeof args.draft === 'boolean' ? args.draft : undefined,
        dryRun: args.dryRun === true,
        actor: actor.name,
      });
    case 'delete_post':
      return deleteAgentPost({
        pathname: getString(args, 'pathname'),
        expectedHash: getString(args, 'expectedHash'),
        confirm: getString(args, 'confirm'),
        dryRun: args.dryRun === true,
        actor: actor.name,
      });
    case 'upload_image':
      return uploadAgentImage({
        filename: getString(args, 'filename'),
        contentBase64: getString(args, 'contentBase64'),
        alt: typeof args.alt === 'string' ? args.alt : undefined,
        dryRun: args.dryRun === true,
        actor: actor.name,
      });
    case 'revalidate_post':
      return revalidatePost(getString(args, 'slug'));
    case 'index_post_for_rag':
      return indexPostForRag(getString(args, 'pathname'));
    case 'publish_post': {
      const upserted = await upsertAgentPost({
        pathname: getString(args, 'pathname'),
        content: getString(args, 'content'),
        expectedHash: typeof args.expectedHash === 'string' ? args.expectedHash : undefined,
        dryRun: args.dryRun === true,
        actor: actor.name,
      });
      if (args.dryRun === true) {
        return { upserted, revalidated: null, indexed: null, dryRun: true };
      }
      const slug = upserted.pathname.replace(/\.(md|mdx)$/i, '');
      const [revalidated, indexed] = await Promise.all([
        revalidatePost(slug),
        indexPostForRag(upserted.pathname),
      ]);
      return { upserted, revalidated, indexed, dryRun: false };
    }
  }
}

export const listTools: AppRouteHandler<typeof routes.listTools> = async (c: any) => {
  const actorOrResponse = authorize(c);
  if (actorOrResponse instanceof Response) {
    return actorOrResponse;
  }

  const visibleTools = BLOG_MCP_TOOLS.filter(tool =>
    tool.requiredScopes.every(scope => actorOrResponse.scopes.includes(scope))
  );

  return c.json({ tools: visibleTools, protocol: 'blog-mcp', version: '1.0.0' }, HttpStatusCodes.OK);
};

export const invokeTool: AppRouteHandler<typeof routes.invokeTool> = async (c: any) => {
  const actorOrResponse = authorize(c);
  if (actorOrResponse instanceof Response) {
    return actorOrResponse;
  }

  const { tool, arguments: args } = c.req.valid('json');
  const startedAt = new Date();

  try {
    const result = await invoke(tool as ToolName, args, actorOrResponse);
    auditBlogMcpTool({
      actor: actorOrResponse.name,
      tool,
      pathname: typeof args.pathname === 'string' ? args.pathname : undefined,
      dryRun: args.dryRun === true,
      success: true,
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
    });
    return c.json(jsonResult(result), HttpStatusCodes.OK);
  } catch (error) {
    auditBlogMcpTool({
      actor: actorOrResponse.name,
      tool,
      pathname: typeof args.pathname === 'string' ? args.pathname : undefined,
      dryRun: args.dryRun === true,
      success: false,
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof BlogMcpError) {
      return c.json(
        { error: error.name, message: error.message },
        error.status as 400 | 401 | 403 | 404 | 409 | 500 | 502
      );
    }

    return c.json(
      {
        error: 'BlogMcpError',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
