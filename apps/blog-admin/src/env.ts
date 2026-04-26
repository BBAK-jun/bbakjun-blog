import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Server-side Environment variables
   * Only accessible on the server
   */
  server: {
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),

    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

    // CORS
    ALLOWED_ORIGINS: z.string().optional().default('http://localhost:3000'),

    // Auth
    AUTH_SECRET: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),

    // Blob Storage
    BLOB_READ_WRITE_TOKEN: z.string().min(1),
    BLOB_STORE_ID: z.string().optional(),

    // API Keys
    BACKOFFICE_API_KEY: z.string().min(1),
    BLOG_MCP_API_KEYS: z.string().optional(),
    RESEND_API_KEY: z.string().min(1).optional(),

    // Blog Revalidation (uses same secret as blog app)
    REVALIDATION_SECRET: z.string().min(1).optional(),

    // Blob CDC Sync Interval (in minutes)
    BLOB_SYNC_INTERVAL_MINUTES: z.coerce.number().min(1).optional().default(30),

    // Redis (optional - for API response caching)
    REDIS_URL: z.string().url().optional(),

    // RAG Gateway API Key
    RAG_GATEWAY_API_KEY: z.string().min(1),

    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },

  /**
   * Client-side Environment variables
   * Must be prefixed with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_BLOG_URL: z.string().url(),
    NEXT_PUBLIC_RAG_GATEWAY_URL: z.string().url(),
  },

  /**
   * Runtime Environment variables
   * Read from process.env
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    LOG_LEVEL: process.env.LOG_LEVEL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    BLOB_STORE_ID: process.env.BLOB_STORE_ID,
    BACKOFFICE_API_KEY: process.env.BACKOFFICE_API_KEY,
    BLOG_MCP_API_KEYS: process.env.BLOG_MCP_API_KEYS,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    REVALIDATION_SECRET: process.env.REVALIDATION_SECRET,
    BLOB_SYNC_INTERVAL_MINUTES: process.env.BLOB_SYNC_INTERVAL_MINUTES,
    REDIS_URL: process.env.REDIS_URL,
    RAG_GATEWAY_API_KEY: process.env.RAG_GATEWAY_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_BLOG_URL: process.env.NEXT_PUBLIC_BLOG_URL,
    NEXT_PUBLIC_RAG_GATEWAY_URL: process.env.NEXT_PUBLIC_RAG_GATEWAY_URL,
  },

  /**
   * Skip validation during build
   * Set to true to skip validation on build (for Docker, etc.)
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
