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

    // Auth
    AUTH_SECRET: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),

    // Blob Storage
    BLOB_READ_WRITE_TOKEN: z.string().min(1),
    BLOB_STORE_ID: z.string().optional(),

    // API Keys
    BACKOFFICE_API_KEY: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1).optional(),

    // Blog Revalidation
    BLOG_REVALIDATION_SECRET: z.string().min(1).optional(),

    // Blob CDC Sync Interval (in minutes)
    BLOB_SYNC_INTERVAL_MINUTES: z.coerce.number().min(1).optional().default(30),

    // Admin Credentials (optional, for initial setup)
    ADMIN_USERNAME: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    ADMIN_EMAIL: z.string().email().optional(),

    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },

  /**
   * Client-side Environment variables
   * Must be prefixed with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_BLOG_URL: z.string().url(),
    NEXT_PUBLIC_RAG_GATEWAY_URL: z.string().url().optional(),
  },

  /**
   * Runtime Environment variables
   * Read from process.env
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    BLOB_STORE_ID: process.env.BLOB_STORE_ID,
    BACKOFFICE_API_KEY: process.env.BACKOFFICE_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    BLOG_REVALIDATION_SECRET: process.env.BLOG_REVALIDATION_SECRET,
    BLOB_SYNC_INTERVAL_MINUTES: process.env.BLOB_SYNC_INTERVAL_MINUTES,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
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
