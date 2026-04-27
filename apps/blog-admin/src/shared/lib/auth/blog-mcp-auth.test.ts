import { beforeEach, describe, expect, it, vi } from 'vitest';

const REQUIRED_ENV = {
  DATABASE_URL: 'https://example.com/db',
  AUTH_SECRET: 'secret',
  AUTH_GOOGLE_ID: 'google-id',
  AUTH_GOOGLE_SECRET: 'google-secret',
  BLOB_READ_WRITE_TOKEN: 'blob-token',
  BACKOFFICE_API_KEY: 'backoffice-key',
  RAG_GATEWAY_API_KEY: 'rag-key',
  NEXT_PUBLIC_BLOG_URL: 'https://blog.example.com',
  NEXT_PUBLIC_RAG_GATEWAY_URL: 'https://rag.example.com',
};

async function loadModule() {
  vi.resetModules();
  Object.assign(process.env, REQUIRED_ENV);
  return import('./blog-mcp-auth');
}

describe('blog MCP auth', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('parses scoped API key config', async () => {
    const { parseBlogMcpApiKeys } = await loadModule();

    const keys = parseBlogMcpApiKeys(
      JSON.stringify([
        { name: 'local-agent', key: 'secret-key', scopes: ['blog:read', 'blog:write'] },
      ])
    );

    expect(keys).toEqual([
      { name: 'local-agent', key: 'secret-key', scopes: ['blog:read', 'blog:write'] },
    ]);
  });

  it('accepts JSON wrapped in env-file quotes', async () => {
    const { parseBlogMcpApiKeys } = await loadModule();
    const raw = JSON.stringify([
      { name: 'local-agent', key: 'secret-key', scopes: ['blog:read', 'blog:write'] },
    ]);

    expect(parseBlogMcpApiKeys(`'${raw}'`)).toEqual([
      { name: 'local-agent', key: 'secret-key', scopes: ['blog:read', 'blog:write'] },
    ]);
  });

  it('rejects malformed config instead of granting access', async () => {
    const { parseBlogMcpApiKeys } = await loadModule();

    expect(parseBlogMcpApiKeys('not-json')).toEqual([]);
    expect(parseBlogMcpApiKeys(JSON.stringify([{ name: 'bad', key: 'x', scopes: ['admin:*'] }]))).toEqual([]);
  });

  it('returns actor for a valid bearer token', async () => {
    vi.stubEnv(
      'BLOG_MCP_API_KEYS',
      JSON.stringify([
        { name: 'local-agent', key: 'secret-key', scopes: ['blog:read', 'blog:write'] },
      ])
    );
    const { verifyBlogMcpApiKey } = await loadModule();

    expect(verifyBlogMcpApiKey('Bearer secret-key')).toEqual({
      name: 'local-agent',
      scopes: ['blog:read', 'blog:write'],
    });
  });

  it('rejects missing, non-bearer, and unknown tokens', async () => {
    vi.stubEnv(
      'BLOG_MCP_API_KEYS',
      JSON.stringify([{ name: 'local-agent', key: 'secret-key', scopes: ['blog:read'] }])
    );
    const { verifyBlogMcpApiKey } = await loadModule();

    expect(verifyBlogMcpApiKey(undefined)).toBeNull();
    expect(verifyBlogMcpApiKey('secret-key')).toBeNull();
    expect(verifyBlogMcpApiKey('Bearer wrong')).toBeNull();
  });

  it('enforces required scopes', async () => {
    const { assertBlogMcpScope } = await loadModule();

    expect(() =>
      assertBlogMcpScope({ name: 'reader', scopes: ['blog:read'] }, 'blog:read')
    ).not.toThrow();
    expect(() =>
      assertBlogMcpScope({ name: 'reader', scopes: ['blog:read'] }, 'blog:write')
    ).toThrow('Missing required MCP scope: blog:write');
  });
});
