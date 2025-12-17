import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  /**
   * Server-side Environment variables
   * Only accessible on the server
   */
  server: {
    REDIS_URL: z.string().url().optional(),
    REVALIDATION_SECRET: z.string().min(1).optional(),
  },

  /**
   * Client-side Environment variables
   * Must be prefixed with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    NEXT_PUBLIC_ADMIN_URL: z.string().url(),
    NEXT_PUBLIC_GISCUS_REPO: z.string().optional(),
    NEXT_PUBLIC_GISCUS_REPO_ID: z.string().optional(),
    NEXT_PUBLIC_GISCUS_CATEGORY: z.string().optional(),
    NEXT_PUBLIC_GISCUS_CATEGORY_ID: z.string().optional(),
  },

  /**
   * Runtime Environment variables
   * Read from process.env
   */
  runtimeEnv: {
    REDIS_URL: process.env.REDIS_URL,
    REVALIDATION_SECRET: process.env.REVALIDATION_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
    NEXT_PUBLIC_GISCUS_REPO: process.env.NEXT_PUBLIC_GISCUS_REPO,
    NEXT_PUBLIC_GISCUS_REPO_ID: process.env.NEXT_PUBLIC_GISCUS_REPO_ID,
    NEXT_PUBLIC_GISCUS_CATEGORY: process.env.NEXT_PUBLIC_GISCUS_CATEGORY,
    NEXT_PUBLIC_GISCUS_CATEGORY_ID: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
  },

  /**
   * Skip validation during build
   * Set to true to skip validation on build (for Docker, etc.)
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
