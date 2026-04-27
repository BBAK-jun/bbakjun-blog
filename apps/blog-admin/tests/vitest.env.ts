Object.assign(process.env, {
  NODE_ENV: process.env.NODE_ENV ?? 'test',
  SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION ?? 'true',
});

process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test';
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? 'test-auth-secret';
process.env.AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID ?? 'test-google-id';
process.env.AUTH_GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET ?? 'test-google-secret';
process.env.BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN ?? 'test-blob-token';
process.env.BACKOFFICE_API_KEY = process.env.BACKOFFICE_API_KEY ?? 'test-backoffice-api-key';
process.env.RAG_GATEWAY_API_KEY = process.env.RAG_GATEWAY_API_KEY ?? 'test-rag-gateway-api-key';
process.env.NEXT_PUBLIC_BLOG_URL = process.env.NEXT_PUBLIC_BLOG_URL ?? 'http://localhost:3000';
process.env.NEXT_PUBLIC_RAG_GATEWAY_URL = process.env.NEXT_PUBLIC_RAG_GATEWAY_URL ?? 'http://localhost:3002';
