import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3002),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

    // Qdrant Configuration
    QDRANT_URL: z.string().url(),
    QDRANT_API_KEY: z.string().optional(),

    // LLM Configuration
    OPENAI_API_KEY: z.string().min(1),
    GLM_API_KEY: z.string().min(1),
    LLM_PROVIDER: z.enum(['openai', 'glm']).default('openai'),

    // Embedding Configuration
    EMBEDDING_PROVIDER: z.enum(['openai', 'glm']).default('openai'),
    EMBEDDING_MODEL: z
      .enum([
        'text-embedding-3-small',
        'text-embedding-3-large',
        'text-embedding-ada-002',
        'embedding-2',
        'embedding-3',
        'BAAI/bge-m3',
        'BAAI/bge-large-zh-v1.5',
        'zephyr-embedding',
        'zephyr-embedding-large',
      ])
      .default('text-embedding-3-small'),

    // Optional Redis for caching
    REDIS_URL: z.string().url().optional(),

    // Blog-Admin URL for fetching blob files
    BLOG_ADMIN_URL: z.string().url().default('http://localhost:3001'),

    // CORS Configuration
    ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),

    // API Key Authentication
    RAG_GATEWAY_API_KEY: z.string().min(1),

    // Notification Configuration
    SLACK_WEBHOOK_URL: z.string().url().optional(),
    SLACK_CHANNEL: z.string().optional(),
    NOTIFICATION_EMAILS: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    LOG_LEVEL: process.env.LOG_LEVEL,
    QDRANT_URL: process.env.QDRANT_URL,
    QDRANT_API_KEY: process.env.QDRANT_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GLM_API_KEY: process.env.GLM_API_KEY,
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER,
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL,
    REDIS_URL: process.env.REDIS_URL,
    BLOG_ADMIN_URL: process.env.BLOG_ADMIN_URL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    RAG_GATEWAY_API_KEY: process.env.RAG_GATEWAY_API_KEY,
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
    SLACK_CHANNEL: process.env.SLACK_CHANNEL,
    NOTIFICATION_EMAILS: process.env.NOTIFICATION_EMAILS,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
