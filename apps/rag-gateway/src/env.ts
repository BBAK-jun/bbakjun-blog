import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';
import { config } from 'dotenv';

// Load .env files in development
if (process.env.NODE_ENV !== 'production') {
  config();
}

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3002),

    // Qdrant Configuration
    QDRANT_URL: z.string().url(),
    QDRANT_API_KEY: z.string().optional(),

    // LLM Configuration
    GLM_API_KEY: z.string().min(1),

    // Optional Redis for caching
    REDIS_URL: z.string().url().optional(),

    // Blog-Admin URL for fetching blob files
    BLOG_ADMIN_URL: z.string().url().default('http://localhost:3001'),

    // CORS Configuration
    ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  },
  client: {
    NEXT_PUBLIC_RAG_URL: z.string().url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    QDRANT_URL: process.env.QDRANT_URL,
    QDRANT_API_KEY: process.env.QDRANT_API_KEY,
    GLM_API_KEY: process.env.GLM_API_KEY,
    REDIS_URL: process.env.REDIS_URL,
    BLOG_ADMIN_URL: process.env.BLOG_ADMIN_URL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    NEXT_PUBLIC_RAG_URL: process.env.NEXT_PUBLIC_RAG_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
