# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DEV_BBAK 블로그 - A modern blog built with Next.js 15, TypeScript, MDX, and Redis (Vercel KV). This is a Korean-language technical blog with MDX-based content, real-time view tracking, tag-based filtering, and dark mode support.

## Development Commands

This project uses **pnpm** as the package manager. All commands should be run with `pnpm`:

```bash
# Start development servers for both apps
pnpm dev

# Start specific app only
pnpm dev:blog       # Blog only (port 3000)
pnpm dev:admin      # Admin dashboard only (port 3001)

# Build for production
pnpm build          # Build all apps and packages
pnpm build:blog     # Build blog only
pnpm build:admin    # Build admin dashboard only

# Start production server
pnpm start

# Run linter
pnpm lint

# Type checking
pnpm type-check

# Clean build artifacts
pnpm clean          # Removes .next and dist folders, plus node_modules
```

## Content Architecture

### MDX Post Structure

Blog posts are stored in `content/posts/` with support for nested folder structures:

- **Flat structure**: `content/posts/my-post.mdx` → slug: `my-post`
- **Folder with index**: `content/posts/my-post/index.mdx` → slug: `my-post`
- **Nested folders**: `content/posts/DEV/my-post/index.mdx` → slug: `DEV/my-post`

The first folder level (DEV, REACT, JS, STUDY, TIL, career) acts as a category for related posts scoring.

### Post Front Matter Schema

```yaml
---
title: 'Post Title'
date: '2024-11-15'
description: 'Post description'
tags: ['nextjs', 'react', 'typescript']
author: 'bbakjun'
draft: false # Set to true to exclude from builds
---
```

All fields are required except `draft` (defaults to `false`).

## Core Data Flow

### Post Loading System (`packages/content/src/posts.ts`)

**Blob-Only Architecture**: All posts are loaded from Vercel Blob Storage via CDC cache.

1. **CDC Integration**: Blog app fetches CDC cached blob files via Hono RPC
2. **Explicit Parameters**: All post functions accept `blobFiles` as first parameter
3. **Content Download**: Downloads markdown content from blob URLs in parallel
4. **Front Matter Parsing**: Uses `gray-matter` to extract YAML metadata
5. **Reading Time**: Calculates using `reading-time` library
6. **Related Posts**: Scores posts by shared tags (×3), same category (×2), and recency (×0.5)

**Usage Pattern**:

```typescript
import { getBlobFiles } from '@/lib/blob';
import { getAllPosts, getPostBySlug } from '@repo/content';

// Fetch blob file list from CDC cache via RPC
const blobFiles = await getBlobFiles();

// All post functions require blobFiles parameter
const posts = await getAllPosts(blobFiles);
const post = await getPostBySlug(blobFiles, 'DEV/my-post');
const tags = await getAllTags(blobFiles);
const relatedPosts = await getRelatedPosts(blobFiles, currentPost, 4);
```

**Helper Function** (`apps/blog/src/lib/blob.ts`):

```typescript
export async function getBlobFiles(): Promise<BlobFileInfo[]> {
  const response = await client.api.v1['blob-files'].$get({});
  if (!response.ok) {
    throw new Error('Failed to fetch blob files');
  }
  const { files } = await response.json();
  return files.map(f => ({
    url: f.url,
    pathname: f.pathname,
    contentType: f.contentType,
  }));
}
```

### View Tracking System (`src/lib/redis.ts`)

Uses Redis hashes with session-based deduplication:

- **Key Pattern**: `views:{slug}` (e.g., `views:DEV/my-post`)
- **Hash Fields**:
  - `views`: Total view count
  - `sessions:{sessionId}`: Marker for each unique viewer
- **Deduplication**: `HSETNX` ensures atomic session-based increment (no double-counting)
- **Bot Filtering**: API route filters common crawler user agents
- **TTL**: 24-hour expiry on hash keys

### API Routes

- `GET /api/views/[...slug]`: Fetch view count (60s cache)
- `POST /api/views/[...slug]`: Increment view (session-aware, bot-filtered)
- `GET /api/views/stats`: Total views and popular posts
- `GET /api/og/[...slug]`: Dynamic Open Graph images

## Markdown Processing Pipeline

**Location**: `packages/content/src/markdown.ts`

````
Raw MDX content
  → remark-parse (markdown → AST)
  → remark-gfm (GitHub Flavored Markdown: tables, checkboxes)
  → remark-rehype (markdown AST → HTML AST)
  → rehype-slug (add IDs to headings)
  → rehype-autolink-headings (add anchor links to headings)
  → rehype-highlight (syntax highlighting for code blocks)
  → rehype-mermaid (convert ```mermaid to renderable divs)
  → rehype-optimize-images (lazy loading, responsive images, captions)
  → rehype-stringify (HTML AST → string)
````

### Mermaid Chart Support

Mermaid code blocks are transformed server-side by `packages/content/src/rehype-mermaid.ts`:

1. Detects `code.language-mermaid` elements in HTML AST
2. Wraps content in `<div data-mermaid="..."><pre class="mermaid">...</pre></div>`
3. Client-side: `MermaidRenderer` component initializes mermaid.js on mount

### Image Optimization

Images are optimized server-side by `packages/content/src/rehype-optimize-images.ts`:

1. Detects `<img>` elements in HTML AST
2. Adds `loading="lazy"` and `decoding="async"` for better performance
3. Wraps images with alt text in `<figure>` with `<figcaption>`
4. Adds responsive styling classes
5. Prevents layout shift with proper sizing

**Features**:

- Lazy loading for images below the fold
- Automatic captions from alt text
- Responsive design with hover effects
- Dark mode support
- WebP/AVIF format support via Next.js Image configuration

## ISR (Incremental Static Regeneration)

The blog uses **ISR** to combine static performance with dynamic content updates:

### Revalidation Strategy

- **Blog Posts** (`/blog/[...slug]`): 60 seconds
  - Automatically updates content every minute
  - `dynamicParams: true` allows new posts to be generated on-demand

- **Home Page** (`/`): 60 seconds
  - Latest posts list refreshes every minute

- **Tag Pages** (`/tags/[tag]`): 300 seconds (5 minutes)
  - Tag-based post lists refresh every 5 minutes
  - New tags are generated on-demand

### On-Demand Revalidation

API endpoint: `POST /api/revalidate?secret=<token>&path=<path>`

**Usage from blog-admin**:

```bash
curl -X POST \
  'https://your-blog.vercel.app/api/revalidate?secret=YOUR_SECRET&path=/blog/my-post'
```

**Environment Variables**:

- `REVALIDATION_SECRET`: Secret token for on-demand revalidation (generate with `openssl rand -base64 32`)

**See**: [apps/blog/docs/ISR.md](apps/blog/docs/ISR.md) for complete guide

## Component Architecture

### Page Components (App Router)

- **`src/app/blog/[...slug]/page.tsx`**: Individual post pages
  - Uses `generateStaticParams()` for static generation with ISR
  - Handles catch-all routes for nested slugs
  - Generates metadata with dynamic OG images
  - Renders processed markdown with dangerouslySetInnerHTML
  - **ISR**: 60 second revalidation

### Client Components

- **ViewCounter**: Fetches/increments views via API (session cookie required)
- **TableOfContents**: Client-side heading extraction from DOM
- **MermaidRenderer**: Initializes mermaid.js after hydration
- **Comments**: Giscus integration (requires `NEXT_PUBLIC_GISCUS_REPO_ID`)
- **PopularPosts**: Server component that queries Redis for top posts

### MDX Components (`mdx-components.tsx`)

Custom renderers for MDX elements with Tailwind styling:

- Headings (h1-h3): Bold, dark mode support
- Links: External links open in new tab
- Images: Wrapped in Next.js `Image` component (800×400)
- Code: Inline vs block styles

## Redis Integration

**Environment Variables**:

- `REDIS_URL`: Connection string for Redis instance

**Fallback Behavior**: If Redis is unavailable, view counts return 0 (app continues to work).

**Key Migration**: The ViewCounter class automatically migrates old string-based keys to hash-based keys.

## Vercel Blob CDC (Change Data Capture)

**Problem**: Vercel Blob free tier limits to 2,000 operations/month. Frequent `list()` API calls for file management UIs can exceed this limit quickly.

**Solution**: CDC pipeline that caches Blob file listings in PostgreSQL, reducing API calls by ~99%.

### Architecture

**Location**: `apps/blog-admin/src/lib/blob-cdc.ts`

```
Vercel Blob Storage (Source of Truth)
    ↓
    ↓ Sync every N minutes (configurable via BLOB_SYNC_INTERVAL_MINUTES)
    ↓
PostgreSQL BlobFile table (Cache)
    ↓
    ↓ Read operations
    ↓
Admin UI & Blog App
```

### Key Components

1. **BlobFile Model** (`apps/blog-admin/prisma/schema.prisma`):

   ```prisma
   model BlobFile {
     id          String   @id @default(cuid())
     url         String              // Blob URL (changes on re-upload)
     pathname    String   @unique    // File path (unique identifier)
     size        BigInt
     uploadedAt  DateTime
     contentType String?
     syncedAt    DateTime @default(now())
     lastChecked DateTime @default(now())
     isDeleted   Boolean  @default(false)  // Soft delete
     uploadedBy  String?

     @@index([uploadedAt])
     @@index([isDeleted])
     @@index([lastChecked])
   }
   ```

   **CRITICAL**: `pathname` is the unique identifier, NOT `url`. Vercel Blob generates new URLs on each upload even for the same pathname. Using `url` as unique would create duplicate records.

2. **Sync Function** (`syncBlobToDatabase()`):
   - Calls Vercel Blob `list()` API once
   - Compares with DB cache
   - Adds new files, marks deleted files, updates timestamps
   - Runs automatically based on `BLOB_SYNC_INTERVAL_MINUTES` (default: 30 minutes) via `needsSync()` check

3. **Cache Read** (`getCachedBlobFiles()`):
   - Queries PostgreSQL instead of Blob API
   - Supports pagination, search, filtering
   - Returns only non-deleted files

4. **Upload Hooks** (`onBlobUpload()`, `onBlobDelete()`):
   - Real-time tracking of uploads/deletes
   - Called immediately after Blob operations
   - Non-critical: upload succeeds even if hook fails
   - **`onBlobUpload()`**: Uses `upsert` with `where: { pathname }` to update existing records instead of creating duplicates
   - **`onBlobDelete()`**: Marks files as deleted using `pathname` as identifier

### Hono RPC API Endpoints

**Location**: `apps/blog-admin/src/rpc/routes/blob-files.ts`

**Public Endpoints** (accessible from blog app):

- `GET /api/rpc/blob-files` - List cached blob files
  - Query params: `limit` (default: 1000), `offset` (default: 0), `search`
  - Returns: `{ files: BlobFile[], total: number, hasMore: boolean }`

**Admin Endpoints** (requires authentication):

- `GET /api/rpc/blob-files/admin` - List cached files with auto-sync
  - Query params: `limit` (default: 100), `offset`, `search`, `autoSync` (default: true)
  - Auto-syncs if sync interval elapsed (configurable via `BLOB_SYNC_INTERVAL_MINUTES`)
- `POST /api/rpc/blob-files/admin/sync` - Manual sync trigger
  - Returns sync statistics

### Usage Pattern

**❌ Old (Direct Blob API)**:

```typescript
import { list } from '@vercel/blob';
const { blobs } = await list(); // API call every page load
```

**✅ New (Hono RPC with Type Safety)**:

**Blog App** (`apps/blog/src/lib/rpc.ts`):

```typescript
import { client } from '@/lib/rpc';

// Type-safe API call with automatic validation
const response = await client.api.v1['blob-files'].$get({
  query: { limit: 100, search: 'posts/' },
});

if (!response.ok) {
  throw new Error('Failed to fetch blob files');
}

const { files, total, hasMore } = await response.json();
```

**Blog-Admin App** (server actions):

```typescript
import { getCachedBlobFiles } from '@/lib/blob-cdc';

// Direct database access
const { files, total, hasMore } = await getCachedBlobFiles({
  limit: 100,
  searchTerm: 'posts/',
});
```

### Cost Reduction

- **Before CDC**: ~2000+ Blob API calls/month (exceeded limit)
- **After CDC (30-min default)**: ~48 Blob API calls/month (30-min intervals × 24h × 30d ÷ 60)
- **Savings**: 97.6% reduction in API calls
- **Configurable**: Adjust `BLOB_SYNC_INTERVAL_MINUTES` environment variable to balance freshness vs. cost

### Important Notes

1. **Pathname as Unique Identifier**: `pathname` is the unique constraint, NOT `url`
   - Vercel Blob generates new URLs on each upload even for the same pathname
   - Using `url` as unique would create duplicate records
   - CDC hooks use `where: { pathname }` for upsert operations
   - Migration: `20251219112111_change_pathname_to_unique`

2. **Soft Delete Pattern**: Files are marked `isDeleted: true` instead of removed from DB to maintain history

3. **Eventually Consistent**: Sync interval (default 30 minutes) means slight delay for manual Blob operations

4. **Non-blocking Hooks**: Upload hook failures are logged but don't block uploads

5. **Manual Sync**: Admins can trigger immediate sync via POST endpoint

6. **Auto-sync**: Automatically triggers on GET requests if sync interval elapsed

7. **Configurable Interval**: Set `BLOB_SYNC_INTERVAL_MINUTES` environment variable (default: 30 minutes)

8. **File Overwrite on Update**: CRITICAL - Always use `addRandomSuffix: false` in `put()` calls to prevent duplicate file creation
   - `createFile()`: ✅ Uses `addRandomSuffix: false` ([files.ts:407](apps/blog-admin/src/app/actions/files.ts#L407))
   - `updateFile()`: ✅ Uses `addRandomSuffix: false` ([files.ts:112](apps/blog-admin/src/app/actions/files.ts#L112))
   - Without this option, Vercel Blob creates new files with random suffixes instead of overwriting existing ones

### When to Use CDC

Use this pattern when:

- External API has strict rate limits
- Data doesn't need real-time accuracy (eventual consistency OK)
- Read-heavy workload (many list/fetch operations)
- Source of truth is external (Vercel Blob, S3, etc.)

## Cross-App Communication (Hono RPC)

### Architecture

Blog-admin exposes type-safe Hono RPC endpoints that blog app consumes:

```
Blog App (apps/blog)
    ↓ Hono RPC Client (hc)
    ↓ Type-safe HTTP calls
    ↓
Blog-Admin API (apps/blog-admin)
    ↓ Hono routes with Zod validation
    ↓ OpenAPI contract (@hono/zod-openapi)
    ↓
PostgreSQL (CDC cache)
```

### Key Files

1. **RPC Routes** (`apps/blog-admin/src/rpc/routes/blob-files.ts`):
   - Hono route handlers with Zod validation
   - Public routes (no auth) for blog app
   - Admin routes (session required) for admin UI

2. **Contract Schemas** (`apps/blog-admin/src/contract/schemas/blob-files.ts`):
   - Zod schemas for request/response validation
   - Auto-generates OpenAPI types via `@hono/zod-openapi`

3. **RPC Client** (`apps/blog/src/lib/rpc.ts`):

   ```typescript
   import { AppType } from 'blog-admin/rpc';
   import { hc } from 'hono/client';

   export const client = hc<AppType>(process.env.NEXT_PUBLIC_ADMIN_URL!);
   ```

4. **Type Export** (`apps/blog-admin/src/rpc/index.ts`):
   ```typescript
   export type AppType = typeof app;
   ```

### Build Configuration

**`apps/blog-admin/tsup.config.ts`**:

```typescript
export default defineConfig({
  entry: ['src/rpc/index.ts', 'src/contract/index.ts'],
  format: ['esm'],
  dts: true, // Generate .d.ts files for blog app
  clean: true,
});
```

**`apps/blog-admin/package.json`**:

```json
{
  "main": "./dist/rpc/index.js",
  "types": "./dist/rpc/index.d.ts",
  "exports": {
    "./rpc": {
      "types": "./dist/rpc/index.d.ts",
      "import": "./dist/rpc/index.js"
    }
  }
}
```

### Benefits

1. **Type Safety**: End-to-end TypeScript types from server to client
2. **Validation**: Automatic request/response validation with Zod
3. **OpenAPI**: Auto-generated API documentation
4. **Developer Experience**: Autocomplete and type checking in blog app
5. **Separation of Concerns**: Blog app doesn't need database access

### Environment Variables

**Blog App**:

```
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001  # or production URL
```

**Turbo Configuration** (`turbo.json`):

```json
{
  "globalEnv": ["NEXT_PUBLIC_ADMIN_URL"]
}
```

## Styling System

- **Framework**: Tailwind CSS v4
- **UI Components**: Radix UI primitives (Avatar, Badge, Button, Card, etc.)
- **Dark Mode**: `next-themes` with system preference detection
- **Typography**: `@tailwindcss/typography` for prose styling
- **Utility**: `clsx` + `tailwind-merge` for conditional classes

## UI Layout

### Blog-Admin App Layout

**Full-Screen Layout**: The blog-admin app uses a full-screen layout without max-width constraints to maximize screen space for file management and content editing.

**Key Files**:

- `apps/blog-admin/src/app/dashboard/layout.tsx` - Main dashboard layout wrapper
- `apps/blog-admin/src/app/dashboard/dashboard-nav.tsx` - Navigation header and tabs

**Layout Structure**:

```tsx
// Dashboard Layout (apps/blog-admin/src/app/dashboard/layout.tsx)
<div className="min-h-screen bg-slate-50 dark:bg-slate-900">
  <DashboardNav />
  <main className="px-4 sm:px-6 lg:px-8 py-8">
    {children}
  </main>
</div>

// Navigation (apps/blog-admin/src/app/dashboard/dashboard-nav.tsx)
// Header
<header className="bg-white dark:bg-slate-800 border-b">
  <div className="px-4 sm:px-6 lg:px-8">
    {/* Logo, title, dark mode toggle, logout button */}
  </div>
</header>

// Navigation Tabs
<nav className="bg-white dark:bg-slate-800 border-b">
  <div className="px-4 sm:px-6 lg:px-8">
    {/* Tab buttons for: Create, Files, Upload, History, Settings */}
  </div>
</nav>
```

**Design Decisions**:

- ❌ **No max-width constraints** - Removed `max-w-7xl mx-auto` for full-screen utilization
- ✅ **Responsive padding** - Uses `px-4 sm:px-6 lg:px-8` for appropriate edge spacing
- ✅ **Consistent spacing** - Same padding across header, nav, and main content
- ✅ **Dark mode support** - All layout components support dark theme

**Benefits**:

- More horizontal space for file tables and content editors
- Better use of wide monitors (especially for MDX editing)
- Consistent with modern admin dashboards (Vercel, Netlify, etc.)

## Experience Management System

A career timeline management system for the blog's About page:

### Database Schema
- **Experience**: Stores company, position, period, current status
- **Achievement**: Stores specific accomplishments with descriptions and tags
- Supports ordering by recency (sortOrder field)

### Admin Interface
- Location: `src/app/dashboard/experience/`
- CRUD operations for experiences and achievements
- Timeline visualization on About page in blog

### Blog Integration
- **About Page**: `/about` displays career timeline
- **ExperienceTimeline Component**: Renders chronological career history
- **RPC Routes**: Type-safe API endpoints for data fetching

### Key Files
- `prisma/schema.prisma`: Experience and Achievement models
- `src/rpc/routes/experience.ts`: Hono RPC endpoints
- `src/app/actions/experience.ts`: Server actions for CRUD
- `src/app/dashboard/experience/page.tsx`: Admin interface

## Type-Safe Environment Variables

### Architecture

Uses `@t3-oss/env-nextjs` with Zod for runtime validation and type-safety:

```
Environment Variables (.env.local)
    ↓ Runtime Validation (Zod schemas)
    ↓ Type-safe env object
    ↓
Application Code (with autocomplete!)
```

### Configuration Files

**Blog App** (`apps/blog/src/env.ts`):

```typescript
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    REDIS_URL: z.string().url().optional(),
    REVALIDATION_SECRET: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    NEXT_PUBLIC_ADMIN_URL: z.string().url(),
    NEXT_PUBLIC_GISCUS_REPO: z.string().optional(),
    // ... other NEXT_PUBLIC_* variables
  },
  runtimeEnv: {
    REDIS_URL: process.env.REDIS_URL,
    REVALIDATION_SECRET: process.env.REVALIDATION_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    // ... map all variables
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

**Blog-Admin App** (`apps/blog-admin/src/env.ts`):

```typescript
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(1),
    BLOB_READ_WRITE_TOKEN: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    // ... other server-only variables
  },
  client: {
    NEXT_PUBLIC_BLOG_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    // ... map all variables
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

### Usage Pattern

**❌ Old (Unsafe)**:

```typescript
const url = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
// No autocomplete, no validation, typos at runtime
```

**✅ New (Type-safe)**:

```typescript
import { env } from '@/env';

const url = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
// ✅ Autocomplete works
// ✅ Type checking prevents typos
// ✅ Runtime validation catches missing vars
```

### Benefits

1. **Type Safety**: Full TypeScript autocomplete and type checking
2. **Runtime Validation**: Catches missing/invalid variables at build time
3. **Server/Client Separation**: Prevents accidental exposure of secrets
4. **Clear Error Messages**: Zod provides detailed validation errors
5. **Centralized Configuration**: Single source of truth for all env vars

### Validation Behavior

- **Development**: Validates on first import, throws detailed error if invalid
- **Build**: Validates during build, fails build if invalid
- **Production**: Validates on server startup
- **Skip Validation**: Set `SKIP_ENV_VALIDATION=true` for Docker builds

### Adding New Environment Variables

1. **Add to env.ts schema**:

   ```typescript
   server: {
     NEW_API_KEY: z.string().min(1),
   }
   ```

2. **Add to runtimeEnv**:

   ```typescript
   runtimeEnv: {
     NEW_API_KEY: process.env.NEW_API_KEY,
   }
   ```

3. **Add to turbo.json** (if needed for builds):

   ```json
   {
     "globalEnv": ["NEW_API_KEY"]
   }
   ```

4. **Add to .env.local**:

   ```
   NEW_API_KEY=your-key-here
   ```

5. **Use in code**:
   ```typescript
   import { env } from '@/env';
   const apiKey = env.NEW_API_KEY;
   ```

### Important Notes

- **NEVER use `process.env.*` directly** - always import from `env.ts`
- **Client variables MUST start with `NEXT_PUBLIC_`** - this is Next.js requirement
- **Server variables are NEVER exposed to client** - enforced by t3-env
- **All variables must be declared in both schema and runtimeEnv** - redundant but safe
- **Optional variables use `.optional()`** - required variables will throw if missing

## Next.js Configuration

**`next.config.ts`**:

- Enables MDX support via `@next/mdx`
- Experimental `mdxRs: true` for Rust-based MDX compiler
- Page extensions: `['js', 'jsx', 'md', 'mdx', 'ts', 'tsx']`

## Monorepo Structure

This is a **Turborepo monorepo** with the following structure:

```
├── apps/
│   ├── blog/              # Public blog (Next.js)
│   └── blog-admin/        # Admin dashboard (Next.js + Prisma + Auth.js)
├── packages/
│   ├── analytics/         # @repo/analytics - Redis-based view tracking
│   ├── content/           # @repo/content - MDX processing
│   ├── types/             # @repo/types - Shared TypeScript types
│   ├── ui/                # @repo/ui - Shared UI components
│   └── config/            # @repo/config - Shared configurations
└── turbo.json             # Turborepo configuration
```

### Development Commands (Monorepo)

```bash
# Run all apps
pnpm dev

# Run specific app
pnpm dev:admin        # blog-admin only (port 3001)
pnpm dev:blog         # blog only (port 3000)

# Build specific app
pnpm build:admin      # blog-admin
pnpm build:blog       # blog

# Build all packages and apps
pnpm build

# Type checking
pnpm type-check
```

### Workspace Dependencies

Packages use `workspace:*` protocol for local dependencies:

```json
{
  "dependencies": {
    "@repo/analytics": "workspace:*",
    "@repo/content": "workspace:*",
    "@repo/types": "workspace:*",
    "@repo/ui": "workspace:*"
  }
}
```

### Utility Scripts

The `scripts/` directory contains utilities for managing the blog:

#### Root Scripts (`scripts/`)
- `upload-posts.js`: Uploads blog posts to Vercel Blob Storage
  - `pnpm upload-posts`: Upload posts locally
  - `pnpm upload-posts:prod`: Upload posts to production with admin URL
- `list-posts.js`: Lists all posts in the content directory
- `migrate-images.js`: Migrates image references in markdown files
- `update-mdx-paths.js`: Updates MDX file paths and converts structure
- `cleanup-blob-duplicates.js`: Removes duplicate files from Blob storage
- `cleanup-duplicate-content.js`: Cleans up duplicate content entries

#### Blog-Admin Scripts (`apps/blog-admin/scripts/`)
- `initial-blob-sync.js`: **Critical for setup** - Populates BlobFile table with existing files
  - Usage: `node scripts/initial-blob-sync.js`
  - Must run after first deployment to sync existing Blob files
- `check-duplicates.ts`: Identifies duplicate blob files in database
- `cleanup-duplicates.ts`: Removes duplicate blob file records
- `test-pathname-unique.ts`: Tests pathname unique constraint
- `check-prisma-types.ts`: Verifies Prisma client types

## Testing

### Blog-Admin Tests

**Location**: `apps/blog-admin/tests/`

**Framework**: Vitest (integration tests)

**Test Commands**:

```bash
# Run tests in watch mode
pnpm --filter=blog-admin test

# Run once
pnpm --filter=blog-admin test:run

# UI mode
pnpm --filter=blog-admin test:ui
```

### Test Strategy

Uses **Integration Testing** approach:

- Real PostgreSQL database (via `DATABASE_URL` from `.env.local`)
- No Vercel Blob API mocking needed (CDC functions only handle metadata)
- Fast execution (~6 seconds for 10 tests)
- Test data uses `test/` prefix for isolation

### CDC Tests (`tests/blob-cdc.test.ts`)

**Coverage**:

- ✅ `onBlobUpload()` - Create, update, prevent duplicates, restore soft-deleted files
- ✅ `onBlobDelete()` - Soft delete, timestamp updates, error handling
- ✅ Pathname unique constraint - Database-level validation
- ✅ Multiple files with different pathnames

**Key Test Cases**:

1. **Duplicate Prevention**: Same pathname uploaded 5 times → only 1 record
2. **Upsert Behavior**: Re-upload updates URL, size, and metadata
3. **Soft Delete Recovery**: Deleted file re-uploaded → `isDeleted: false`
4. **Unique Constraint**: Database rejects duplicate pathname inserts

**Test Setup** (`tests/setup.ts`):

- Automatic cleanup before/after all tests
- Shared Prisma Client for all tests
- Loads `.env.local` for database connection

### Testing Tips
- **Database Testing**: Tests use real PostgreSQL instance (not mocked)
- **Test Data Prefix**: All test data uses `test/` prefix for easy cleanup
- **CDC Testing**: Tests verify CDC hooks work correctly with real Vercel Blob operations
- **Test Isolation**: Each test runs in clean state, no shared state between tests

### Debugging Tests
If tests fail:
1. **Check Database Connection**: Ensure `DATABASE_URL` is set in `.env.local`
2. **Prisma Client Restart**: Run `rm -rf node_modules/.prisma && pnpm install`
3. **Test Cleanup**: Manually clean test data from database
4. **Blob Mocks**: Some functions interact with real Blob API (check `vi.mocked()` calls)

### Type Checking

```bash
# Run TypeScript type checking
pnpm --filter=blog-admin type-check
```

**Note**: If VSCode shows type errors but `tsc` passes, restart TypeScript server:

- `Cmd+Shift+P` → "TypeScript: Restart TS Server"

### Build Verification

```bash
# Full production build (includes type checking)
pnpm --filter=blog-admin build
```

### Test Writing Guidelines

**IMPORTANT**: All tests must be written in Korean (한글).

**Test Naming Convention**:

- `describe()` blocks: Use Korean descriptive names
  - ✅ Good: `describe('파일 업데이트 통합 테스트 - CDC 동기화', () => { ... })`
  - ❌ Bad: `describe('File Update Integration - CDC Sync', () => { ... })`

- `it()` blocks: Use Korean imperative sentences ending with `~해야 함`
  - ✅ Good: `it('파일 업데이트 시 DB의 blob URL이 새 URL로 변경되어야 함', async () => { ... })`
  - ❌ Bad: `it('should update blob URL in database when file is updated', async () => { ... })`

**Comment Convention**:

- Test comments: Use Korean for clarity
  - ✅ Good: `// 1. DB에 초기 레코드 생성 (첫 업로드 시뮬레이션)`
  - ❌ Bad: `// 1. Create initial record in DB (simulate first upload)`

**Examples**:

```typescript
describe('파일 업데이트 통합 테스트 - CDC 동기화', () => {
  beforeEach(async () => {
    // 테스트 전 정리
    await testPrisma.blobFile.deleteMany({ ... });
  });

  it('파일 업데이트 시 DB의 blob URL이 새 URL로 변경되어야 함', async () => {
    // 1. DB에 초기 레코드 생성
    await testPrisma.blobFile.create({ ... });

    // 2. Vercel Blob put이 새 URL을 반환하도록 Mock
    vi.mocked(blobModule.put).mockResolvedValue({ ... });

    // 3. updateFile 액션 호출
    const result = await updateFile({ ... });

    // 4. 검증
    expect(result.success).toBe(true);
    expect(record?.url).toBe(newUrl);
  });
});
```

**Why Korean?**:

- Better readability for Korean-speaking team members
- Clearer intent and expectations in native language
- Consistent with project documentation (CLAUDE.md is in Korean)
- Test output shows Korean descriptions for better debugging

## Deployment Notes

### Blog App (apps/blog)

**Platform**: Vercel (optimized for Next.js)

**Required Environment Variables**:

```
REDIS_URL=redis://...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_GISCUS_REPO_ID=... (optional, for comments)
REVALIDATION_SECRET=... (for on-demand ISR revalidation)
NEXT_PUBLIC_ADMIN_URL=https://... (blog-admin URL for newsletter API)
```

**Build Process**:

1. Static generation for all posts via `generateStaticParams()` with ISR
2. API routes deployed as serverless functions
3. Redis connection pooled via Vercel KV
4. ISR revalidation: 60s for posts/home, 300s for tags

**ISR Configuration**:

- Blog posts and home page automatically refresh every 60 seconds
- Tag pages refresh every 5 minutes
- On-demand revalidation available via `/api/revalidate` endpoint
- See [apps/blog/docs/ISR.md](apps/blog/docs/ISR.md) for details

### Blog-Admin App (apps/blog-admin)

**Platform**: Vercel

**Required Environment Variables**:

```
DATABASE_URL=postgresql://...           # Neon PostgreSQL
DIRECT_URL=postgresql://...             # Direct connection (non-pooled)
AUTH_SECRET=...                         # openssl rand -base64 32
AUTH_GOOGLE_ID=...                      # Google OAuth Client ID
AUTH_GOOGLE_SECRET=...                  # Google OAuth Client Secret
BLOB_READ_WRITE_TOKEN=...               # Vercel Blob Storage token
BLOB_STORE_ID=...                       # Vercel Blob Store ID
BLOB_SYNC_INTERVAL_MINUTES=30           # CDC sync interval in minutes (default: 30)
BACKOFFICE_API_KEY=...                  # Legacy API key
JWT_SECRET=...                          # openssl rand -base64 32
NEXT_PUBLIC_BLOG_URL=https://...        # Public blog URL
RESEND_API_KEY=...                      # Resend email API key (for newsletter)
```

### **CRITICAL: First-Time Setup After Deployment**

After deploying blog-admin for the first time, you MUST run the initial blob sync:

```bash
# SSH into the deployment environment or run locally with correct env vars
node scripts/initial-blob-sync.js
```

**Why This Is Critical**:
- The BlobFile table starts empty
- Existing files in Vercel Blob won't appear in admin UI without this
- Admin dashboard relies on CDC cache, not direct Blob API

**Steps**:
1. Deploy blog-admin to Vercel
2. Set all environment variables in Vercel dashboard
3. Run initial sync script to populate database
4. Verify files appear in admin dashboard

**Critical Setup**:

1. **Prisma Client Generation**: `postinstall` script runs `prisma generate`
2. **Environment Variables**: All env vars must be declared in `turbo.json`
3. **Build Configuration**: Uses `vercel.json` with custom build commands

**CRITICAL - Vercel Environment Variables (Prisma 7)**:

⚠️ **NEVER wrap environment variable values in quotes on Vercel**:

❌ Wrong:

```
DATABASE_URL = "postgresql://user:pass@host/db?sslmode=require"
```

✅ Correct:

```
DATABASE_URL = postgresql://user:pass@host/db?sslmode=require
```

**Why**: Vercel treats quotes as part of the value, causing Prisma to fail with cryptic errors like "Can't reach database server at base". Always enter raw values without quotes.

**Deployment Issues & Solutions**:

See [apps/blog-admin/docs/DEPLOYMENT.md](apps/blog-admin/docs/DEPLOYMENT.md) for:

- Prisma Client build errors
- Turborepo environment variable warnings
- Prisma 7 database connection issues
- Complete troubleshooting guide

### Turborepo Environment Variables

**IMPORTANT**: All environment variables used in the monorepo must be declared in `turbo.json`:

```json
{
  "globalEnv": ["NODE_ENV", "VERCEL", "DATABASE_URL", ...],
  "tasks": {
    "build": {
      "env": ["DATABASE_URL", "AUTH_SECRET", ...]
    }
  }
}
```

For library packages that don't use environment variables, add `"envMode": "loose"` to their `package.json`:

```json
{
  "name": "@repo/types",
  "envMode": "loose"
}
```

## Common Patterns

### Adding a New Post

1. Create `content/posts/{category}/{slug}/index.mdx`
2. Add front matter (title, date, description, tags, author)
3. Build will auto-discover and generate static page
4. Related posts calculated based on tags and category

### Modifying Markdown Rendering

Edit the unified pipeline in `src/lib/markdown.ts`. Add rehype/remark plugins to the processor chain.

### Customizing UI Components

- Base components: `src/components/ui/` (shadcn/ui pattern)
- Feature components: `src/components/` (blog-specific)
- Global styles: Applied via `src/app/layout.tsx`

### Session Tracking

Session IDs are managed client-side (see `ViewCounter` component). The backend uses cookies to deduplicate views within 24 hours.

## Documentation Guidelines

**CRITICAL**: Always update documentation when making significant changes to the codebase.

### When to Update Documentation

1. **After Adding New Features**
   - Update relevant files in `apps/[app-name]/docs/`
   - Add API documentation if new endpoints created
   - Update ARCHITECTURE.md if structure changes

2. **After Fixing Deployment Issues**
   - Document the issue in `apps/blog-admin/docs/DEPLOYMENT.md` under "문제 해결 (트러블슈팅)"
   - Include error messages, causes, and solutions
   - Update CLAUDE.md if it's a critical pattern to remember

3. **After Adding Environment Variables**
   - Update `turbo.json` with new variables
   - Document in CLAUDE.md under "Deployment Notes"
   - Add to DEPLOYMENT.md's environment variables section

4. **After Major Refactoring**
   - Update ARCHITECTURE.md with new structure
   - Update code examples in documentation
   - Update CLAUDE.md if patterns changed

5. **After Adding Dependencies**
   - Document why the dependency was added
   - Note any special configuration required
   - Update package-specific README if needed

6. **After Adding Tests**
   - Update test documentation in `tests/README.md`
   - Document test strategy if it's a new pattern
   - Update CLAUDE.md with test commands

### Documentation Structure to Follow

```
Problem/Feature → Solution → Documentation Update
```

**Example Flow**:

1. Fix Prisma build issue
2. Update `package.json` with `postinstall` script
3. **Document in**:
   - ✅ `apps/blog-admin/docs/DEPLOYMENT.md` (troubleshooting section)
   - ✅ `CLAUDE.md` (critical setup section)

### Files to Update Based on Change Type

| Change Type            | Update These Files                                     |
| ---------------------- | ------------------------------------------------------ |
| Deployment issue       | `apps/blog-admin/docs/DEPLOYMENT.md`, `CLAUDE.md`      |
| New API endpoint       | `apps/blog-admin/docs/API.md`                          |
| Database schema change | `CLAUDE.md` (Vercel Blob CDC section), migration files |
| New tests              | `tests/README.md`, `CLAUDE.md` (Testing section)       |
| Architecture change    | `apps/blog-admin/docs/ARCHITECTURE.md`, `CLAUDE.md`    |
| Environment variable   | `turbo.json`, `CLAUDE.md`, `DEPLOYMENT.md`             |
| New pattern/convention | `CLAUDE.md`, relevant `/docs/` files                   |
| Bug fix (significant)  | `DEPLOYMENT.md` or `DEVELOPMENT.md`                    |

### Documentation Template for Issues

When documenting a resolved issue in DEPLOYMENT.md:

```markdown
#### Issue Title

**오류 메시지**:
\`\`\`
[Exact error message]
\`\`\`

**원인**: [Root cause explanation]

**해결 방법**:

1. [Step 1 with code example]
2. [Step 2 with code example]
3. [Verification step]
```

### What NOT to Document

- Minor variable renames
- Simple typo fixes
- Temporary debugging code
- Routine dependency updates (unless breaking changes)

### Documentation Priority

**HIGH (Must document immediately)**:

- Deployment configuration changes
- Build process changes
- Critical bug fixes
- New environment variables
- Breaking changes

**MEDIUM (Document when convenient)**:

- New features
- API changes
- Architecture refactoring
- New utilities
- Database schema changes
- New tests

**LOW (Optional)**:

- Internal helper functions
- Minor optimizations
- Code cleanup

### Self-Check Before Completing Task

Before marking a task complete, ask:

1. ✅ Did I update CLAUDE.md if this is a pattern to remember?
2. ✅ Did I update DEPLOYMENT.md if this affects deployment?
3. ✅ Did I update API.md if I added/changed endpoints?
4. ✅ Did I update turbo.json if I used new environment variables?
5. ✅ Did I update ARCHITECTURE.md if structure changed?
6. ✅ Did I write tests for critical functionality (CDC, API endpoints, business logic)?
7. ✅ Did I update tests/README.md if I added new test patterns?
8. ✅ Did I run type checking and tests before completing?

**If any answer is YES but not done → Update documentation/tests first, then complete task.**
- 한 줄에서 여러 에이전트 명시적으로 호출
코드를 분석해줄래. 다음을 병렬로 실행해:
- Use code-analyst to extract facts
- 그 다음 domain-analyst와 feature-spec-writer를 동시에 실행해서 
  facts.md를 기반으로 context.md와 FEATURE_SPEC.md를 생성해줄래